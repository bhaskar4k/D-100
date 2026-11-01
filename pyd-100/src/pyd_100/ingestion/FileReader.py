import os
from typing import Any

import polars as pl

from .DataReader import (
    GetExtension,
    IsSupported,
    ReadFileAsPolarsLazyFrame,
    SupportedExtensions,
)
from ..dto import BaseDto, ErrorDto, SuccessDto
from ..enums import HttpStatusCode
from ..enums.data_type import FromPolarsDtype
from ..registry import expose


MaxPreviewRowCount = 10000


def GetColumnMetadata(FilePath: str, ColumnName: str) -> dict[str, Any]:
    """Exact metadata for one column, shaped like a single columnInfo entry of GetFileMetadata:

        { type, nullable, uniqueCount, nullValueCount }

    - type            a DataType enum value (int) derived from the column's polars dtype.
    - nullable        True if the column actually contains at least one null (matches
                      GetFileMetadata's definition — "has nulls now", not "declared nullable").
    - uniqueCount     number of distinct non-null values (nulls are not counted).
    - nullValueCount  number of null (empty) cells in the column.

    Reusable helper, not exposed to Node: callers that need to publish this through the
    registry wrap it in their own @expose'd function. Scans one column only (parquet is
    columnar), so stays cheap on large files.

    Raises FileNotFoundError / ValueError / KeyError for the three failure modes so callers
    can decide how to surface them.
    """
    if not os.path.isfile(FilePath):
        raise FileNotFoundError(f"File not found: '{FilePath}'.")

    if not IsSupported(FilePath):
        raise ValueError(
            f"Unsupported file type '{GetExtension(FilePath)}'. Supported: {', '.join(SupportedExtensions)}"
        )

    if not ColumnName or not ColumnName.strip():
        raise ValueError("Column name is required.")

    Lazy = ReadFileAsPolarsLazyFrame(FilePath)
    Schema = Lazy.collect_schema()

    if ColumnName not in Schema.names():
        raise KeyError(f"Column '{ColumnName}' not found in file.")

    Dtype = Schema[ColumnName]

    # One pass over the one column: null count + distinct-non-null count.
    Counts = Lazy.select(
        pl.col(ColumnName).null_count().alias("null_count"),
        pl.col(ColumnName).drop_nulls().n_unique().alias("unique_count"),
    ).collect().row(0)

    NullValueCount = int(Counts[0])
    UniqueCount = int(Counts[1])

    return {
        "type": int(FromPolarsDtype(Dtype)),
        "nullable": NullValueCount > 0,
        "uniqueCount": UniqueCount,
        "nullValueCount": NullValueCount,
    }


@expose
def GetFileMetadata(FilePath: str) -> BaseDto:
    """Exact metadata of a data file, shaped like the API's DatafileMetadata:

        { rowCount, columnInfo: [{ name, type, nullable, uniqueCount, nullValueCount }] }

    - rowCount        number of data rows (the header is not counted).
    - type            a DataType enum value.
    - nullable        True if the column actually contains at least one null (empty cell).
    - uniqueCount     number of distinct non-null values (SQL's COUNT(DISTINCT ...); nulls are not counted).
    - nullValueCount  number of null (empty) cells in the column.

    Everything is computed over the whole file in one pass, never from a sample.
    """
    if not os.path.isfile(FilePath):
        return ErrorDto(None, "File not found.", HttpStatusCode.NOT_FOUND, {"FilePath": FilePath})

    if not IsSupported(FilePath):
        return ErrorDto(
            None,
            f"Unsupported file type '{GetExtension(FilePath)}'. Supported: {', '.join(SupportedExtensions)}",
            HttpStatusCode.BAD_REQUEST,
            {"FilePath": FilePath},
        )

    try:
        Lazy = ReadFileAsPolarsLazyFrame(FilePath)
        Schema = Lazy.collect_schema()

        if len(Schema) == 0:
            return ErrorDto(None, "The file has no columns.", HttpStatusCode.UNPROCESSABLE_ENTITY, {"FilePath": FilePath})

        # Columns are addressed by position (pl.nth), so unusual names (duplicates, regex-like
        # names such as "^a$", empty names) can never be misread as something else.
        Expressions: list[pl.Expr] = [pl.len().alias("rows")]

        for Index in range(len(Schema)):
            Expressions.append(pl.nth(Index).null_count().alias(f"nulls_{Index}"))
            Expressions.append(pl.nth(Index).drop_nulls().n_unique().alias(f"unique_{Index}"))

        Counts = Lazy.select(Expressions).collect().row(0)
    except Exception as error:  # noqa: BLE001 - unreadable/corrupt files are a client problem, not a crash
        return ErrorDto(
            None,
            f"Could not read the file: {error}",
            HttpStatusCode.UNPROCESSABLE_ENTITY,
            {"FilePath": FilePath, "type": type(error).__name__},
        )

    ColumnInfo = [
        {
            "name": Name,
            "type": int(FromPolarsDtype(Dtype)),
            "nullable": Counts[1 + 2 * Index] > 0,
            "uniqueCount": Counts[2 + 2 * Index],
            "nullValueCount": Counts[1 + 2 * Index],
        }
        for Index, (Name, Dtype) in enumerate(Schema.items())
    ]

    return SuccessDto({"rowCount": Counts[0], "columnInfo": ColumnInfo}, "File metadata retrieved.", HttpStatusCode.OK)


@expose
def PreviewDataset(FilePath: str, TopN: int) -> BaseDto:
    """Returns the first TopN rows of the file at FilePath as JSON-friendly records.

    The LazyFrame is sliced before collect so only TopN rows are materialized, which
    keeps the preview cheap for very large files. Each row is a dict keyed by column
    name; values are plain Python scalars that the __main__ JSON writer handles via
    its str() fallback for date / datetime / decimal / bytes.
    """
    if not os.path.isfile(FilePath):
        return ErrorDto(None, "File not found.", HttpStatusCode.NOT_FOUND)

    if not IsSupported(FilePath):
        return ErrorDto(
            None,
            f"Unsupported file type '{GetExtension(FilePath)}'. Supported: {', '.join(SupportedExtensions)}",
            HttpStatusCode.BAD_REQUEST,
        )

    if not isinstance(TopN, int) or TopN <= 0:
        return ErrorDto(None, "TopN must be a positive integer.", HttpStatusCode.BAD_REQUEST)

    # Clamp defensively so a mis-configured env var can't materialize an unbounded slice.
    Limit = min(TopN, MaxPreviewRowCount)

    try:
        Rows = ReadFileAsPolarsLazyFrame(FilePath).head(Limit).collect().to_dicts()
    except Exception as error:  # noqa: BLE001 - unreadable/corrupt files are a client problem, not a crash
        return ErrorDto(
            None,
            f"Could not read the file: {error}",
            HttpStatusCode.UNPROCESSABLE_ENTITY,
        )

    return SuccessDto(Rows, "Preview rows retrieved.", HttpStatusCode.OK)
