"""Missing-value handling.

Dispatches on `ReplacementStrategy` (string enum matching
`api/src/enum/MissingValueReplacementStrategyEnum.ts`) and rewrites the parquet in-place with the
chosen column cleaned. Everything runs on a polars LazyFrame so a huge dataset streams end to
end: the aggregate used by the strategy (mean/median/mode/min/max) is expressed inside
`fill_null`, so polars plans a single scan and `sink_parquet` writes without materializing the
frame in memory.

Transactional contract with the caller:
    - A `.bak` copy of the original is kept beside the file until the caller tells us the
      downstream DB write committed. The on-disk swap of the cleaned file is itself atomic
      (sibling .tmp + os.replace), so FilePath always references either the pre-call bytes or
      the post-call bytes, never a half-written frame.
    - On success we return `backupPath` in the response. The caller must either:
          * delete the backup after its DB transaction commits, or
          * rename the backup back over FilePath (fs.rename) to roll back, then mark the row
            FAILED.
    - On any failure here we clean up our own temp artifacts and restore from the backup
      ourselves, so FilePath is unchanged when we return an ErrorDto.
"""

import os
import shutil
from typing import Any, Callable

import polars as pl

from ..dto import BaseDto, ErrorDto, SuccessDto
from ..enums import HttpStatusCode
from ..enums.data_type import FromPolarsDtype
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


def _apply_mean(lf: pl.LazyFrame, column: str, _constant: str | None) -> pl.LazyFrame:
    return lf.with_columns(pl.col(column).fill_null(pl.col(column).mean()))


def _apply_median(lf: pl.LazyFrame, column: str, _constant: str | None) -> pl.LazyFrame:
    return lf.with_columns(pl.col(column).fill_null(pl.col(column).median()))


def _apply_mode(lf: pl.LazyFrame, column: str, _constant: str | None) -> pl.LazyFrame:
    # Expr.mode returns every tied value; .first() picks a deterministic one, matching what
    # sklearn's SimpleImputer does for ties. drop_nulls keeps the mode well-defined when nulls
    # outnumber everything else.
    return lf.with_columns(
        pl.col(column).fill_null(pl.col(column).drop_nulls().mode().first())
    )


def _apply_min(lf: pl.LazyFrame, column: str, _constant: str | None) -> pl.LazyFrame:
    return lf.with_columns(pl.col(column).fill_null(pl.col(column).min()))


def _apply_max(lf: pl.LazyFrame, column: str, _constant: str | None) -> pl.LazyFrame:
    return lf.with_columns(pl.col(column).fill_null(pl.col(column).max()))


def _apply_constant(lf: pl.LazyFrame, column: str, constant: str | None) -> pl.LazyFrame:
    if constant is None:
        raise ValueError("Constant strategy requires a value.")

    # The incoming constant is always a string (the UI's text input). Cast it to the column's
    # dtype so the fill matches the column's native type instead of becoming String across the
    # column. collect_schema reads only the lazy plan's schema, no data is scanned.
    dtype = lf.collect_schema()[column]
    literal = pl.lit(constant).cast(dtype, strict=True)

    return lf.with_columns(pl.col(column).fill_null(literal))


def _apply_forward_fill(lf: pl.LazyFrame, column: str, _constant: str | None) -> pl.LazyFrame:
    return lf.with_columns(pl.col(column).forward_fill())


def _apply_backward_fill(lf: pl.LazyFrame, column: str, _constant: str | None) -> pl.LazyFrame:
    return lf.with_columns(pl.col(column).backward_fill())


# Switch over strategy. Keeping this as a map (rather than if/elif) keeps the dispatch in one
# place and makes it easy to add a strategy later: define `_apply_x`, register it here, and the
# enum constant above.
_STRATEGY_HANDLERS: dict[str, Callable[[pl.LazyFrame, str, str | None], pl.LazyFrame]] = {
    MEAN: _apply_mean,
    MEDIAN: _apply_median,
    MODE: _apply_mode,
    MIN: _apply_min,
    MAX: _apply_max,
    CONSTANT: _apply_constant,
    FORWARD_FILL: _apply_forward_fill,
    BACKWARD_FILL: _apply_backward_fill,
}


def _collect_column_metadata(FilePath: str, ColumnName: str) -> dict[str, Any]:
    """Reads one column's fresh metadata from the parquet after it has been written.

    Shape matches the single-column slice of GetFileMetadata's columnInfo entries:
        { type, nullable, uniqueCount, nullValueCount }

    Scans one column only (parquet is columnar), so this stays cheap on large files.
    """
    lazy = pl.scan_parquet(FilePath)
    schema = lazy.collect_schema()
    dtype = schema[ColumnName]

    counts = lazy.select(
        pl.col(ColumnName).null_count().alias("null_count"),
        pl.col(ColumnName).drop_nulls().n_unique().alias("unique_count"),
    ).collect().row(0)

    null_value_count = int(counts[0])
    unique_count = int(counts[1])

    return {
        "type": int(FromPolarsDtype(dtype)),
        "nullable": null_value_count > 0,
        "uniqueCount": unique_count,
        "nullValueCount": null_value_count,
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

    Returns a SuccessDto whose data is:
        {
            filePath, columnName, strategy, backupPath,
            columnMetadata: { type, nullable, uniqueCount, nullValueCount }
        }
    The caller must either delete `backupPath` after its DB commit, or rename it back over
    FilePath to roll the file change back.
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
    BackupPath = FilePath + ".bak"
    constant = str(ConstantValue) if ConstantValue is not None else None

    # Track which artifacts exist so the catch block can clean up precisely.
    temp_exists = False
    backup_exists = False
    swapped = False

    try:
        lf = ReadFileAsPolarsLazyFrame(FilePath)

        # collect_schema reads only the lazy plan's schema (parquet footer), nothing is
        # materialized.
        column_names = lf.collect_schema().names()

        if ColumnName not in column_names:
            return ErrorDto(
                False,
                f"Column '{ColumnName}' not found in file.",
                HttpStatusCode.NOT_FOUND,
            )

        cleaned = handler(lf, ColumnName, constant)

        # Streams the lazy plan to disk; the frame is never materialized in memory.
        SaveLazyFrameAsParquet(cleaned, TempPath)
        temp_exists = True

        # Copy, not move: the live file keeps serving reads if the caller rolls back. Takes 2x
        # disk briefly, which is cheaper than another full pass over the original.
        shutil.copy2(FilePath, BackupPath)
        backup_exists = True

        os.replace(TempPath, FilePath)
        swapped = True
        temp_exists = False  # os.replace consumed TempPath

        column_metadata = _collect_column_metadata(FilePath, ColumnName)

    except Exception as error:
        # Restore the original file bytes if we got as far as swapping, then wipe our own temp
        # artifacts. The caller sees an ErrorDto with FilePath exactly as it was.
        if swapped and backup_exists:
            try:
                os.replace(BackupPath, FilePath)
                backup_exists = False
            except OSError:
                pass

        if backup_exists:
            try:
                os.remove(BackupPath)
            except OSError:
                pass

        if temp_exists and os.path.exists(TempPath):
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
            "backupPath": BackupPath,
            "columnMetadata": column_metadata,
        },
        "Missing values handled.",
        HttpStatusCode.OK,
    )
