"""Missing-value handling.

Dispatches on `ReplacementStrategy` (string enum matching
`api/src/enum/MissingValueReplacementStrategyEnum.ts`) and rewrites the parquet in-place with the
chosen column cleaned. Writes to a sibling `.tmp` first and atomically swaps with `os.replace`
so a crash mid-write never leaves a half-written file.
"""

import os
from typing import Any, Callable

import polars as pl

from ..dto import BaseDto, ErrorDto, SuccessDto
from ..enums import HttpStatusCode
from ..ingestion.DataReader import GetExtension, ReadFileAsPolarsLazyFrame
from ..ingestion.FileWriter import SaveLazyFrameAsParquet
from ..registry import expose


# Mirrors api/src/enum/MissingValueReplacementStrategyEnum.ts. Values are the contract across
# Node, Python and the DB-seeded `replacment_strategy_enum`; never rename, only add.
MEAN = "MEAN"
MEDIAN = "MEDIAN"
MODE = "MODE"
MIN = "MIN"
MAX = "MAX"
CONSTANT = "CONSTANT"
FORWARD_FILL = "FORWARD_FILL"
BACKWARD_FILL = "BACKWARD_FILL"


def _apply_mean(df: pl.DataFrame, column: str, _constant: str | None) -> pl.DataFrame:
    value = df.get_column(column).mean()
    return df.with_columns(pl.col(column).fill_null(value))


def _apply_median(df: pl.DataFrame, column: str, _constant: str | None) -> pl.DataFrame:
    value = df.get_column(column).median()
    return df.with_columns(pl.col(column).fill_null(value))


def _apply_mode(df: pl.DataFrame, column: str, _constant: str | None) -> pl.DataFrame:
    # Series.mode returns every tied value; the first entry is a deterministic choice that
    # matches what sklearn's SimpleImputer does for ties.
    modes = df.get_column(column).drop_nulls().mode()

    if modes.len() == 0:
        return df

    return df.with_columns(pl.col(column).fill_null(modes[0]))


def _apply_min(df: pl.DataFrame, column: str, _constant: str | None) -> pl.DataFrame:
    value = df.get_column(column).min()
    return df.with_columns(pl.col(column).fill_null(value))


def _apply_max(df: pl.DataFrame, column: str, _constant: str | None) -> pl.DataFrame:
    value = df.get_column(column).max()
    return df.with_columns(pl.col(column).fill_null(value))


def _apply_constant(df: pl.DataFrame, column: str, constant: str | None) -> pl.DataFrame:
    if constant is None:
        raise ValueError("Constant strategy requires a value.")

    # The incoming constant is always a string (the UI's text input). Cast it to the column's
    # dtype so the fill matches the column's native type instead of becoming String across the
    # column.
    dtype = df.schema[column]
    literal = pl.lit(constant).cast(dtype, strict=True)

    return df.with_columns(pl.col(column).fill_null(literal))


def _apply_forward_fill(df: pl.DataFrame, column: str, _constant: str | None) -> pl.DataFrame:
    return df.with_columns(pl.col(column).forward_fill())


def _apply_backward_fill(df: pl.DataFrame, column: str, _constant: str | None) -> pl.DataFrame:
    return df.with_columns(pl.col(column).backward_fill())


# Switch over strategy. Keeping this as a map (rather than if/elif) keeps the dispatch in one
# place and makes it easy to add a strategy later: define `_apply_x`, register it here, and the
# enum constant above.
_STRATEGY_HANDLERS: dict[str, Callable[[pl.DataFrame, str, str | None], pl.DataFrame]] = {
    MEAN: _apply_mean,
    MEDIAN: _apply_median,
    MODE: _apply_mode,
    MIN: _apply_min,
    MAX: _apply_max,
    CONSTANT: _apply_constant,
    FORWARD_FILL: _apply_forward_fill,
    BACKWARD_FILL: _apply_backward_fill,
}


@expose
def HandleMissingValue(
    FilePath: str,
    ColumnName: str,
    ReplacementStrategy: str,
    ConstantValue: Any = None,
) -> BaseDto:
    """Fills nulls in ColumnName of the parquet at FilePath using ReplacementStrategy.

    FilePath         absolute path to the ingest parquet
    ColumnName       the column to clean
    ReplacementStrategy  one of MEAN / MEDIAN / MODE / MIN / MAX / CONSTANT / FORWARD_FILL / BACKWARD_FILL
    ConstantValue    required (and only used) when ReplacementStrategy is CONSTANT
    """
    if not os.path.isfile(FilePath):
        return ErrorDto(False, "File not found.", HttpStatusCode.NOT_FOUND)

    if GetExtension(FilePath) != ".parquet":
        return ErrorDto(False, "Only .parquet files are supported for missing-value handling.", HttpStatusCode.BAD_REQUEST)

    if not ColumnName or not ColumnName.strip():
        return ErrorDto(False, "Column name is required.", HttpStatusCode.BAD_REQUEST)

    handler = _STRATEGY_HANDLERS.get(ReplacementStrategy)
    if handler is None:
        return ErrorDto(
            False,
            f"Unknown replacement strategy '{ReplacementStrategy}'.",
            HttpStatusCode.BAD_REQUEST,
        )

    TempPath = FilePath + ".tmp"
    constant = str(ConstantValue) if ConstantValue is not None else None

    try:
        df = ReadFileAsPolarsLazyFrame(FilePath).collect()

        if ColumnName not in df.columns:
            return ErrorDto(
                False,
                f"Column '{ColumnName}' not found in file.",
                HttpStatusCode.NOT_FOUND,
            )

        cleaned = handler(df, ColumnName, constant)

        # Count how many nulls remained after the fill — forward/backward fill can legitimately
        # leave edge nulls behind, mode on an all-null column leaves everything, and the result
        # is useful information for the caller.
        remaining_nulls = int(cleaned.get_column(ColumnName).null_count())

        SaveLazyFrameAsParquet(cleaned.lazy(), TempPath)
        os.replace(TempPath, FilePath)

    except Exception as error:
        if os.path.exists(TempPath):
            try:
                os.remove(TempPath)
            except OSError:
                pass

        return ErrorDto(
            False,
            f"Could not apply the replacement strategy: {error}",
            HttpStatusCode.UNPROCESSABLE_ENTITY,
        )

    return SuccessDto(
        {
            "filePath": FilePath,
            "columnName": ColumnName,
            "strategy": ReplacementStrategy,
            "remainingNullCount": remaining_nulls,
        },
        "Missing values handled.",
        HttpStatusCode.OK,
    )
