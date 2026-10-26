import os

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


@expose
def GetFileMetadata(FilePath: str) -> BaseDto:
    """Exact metadata of a data file, shaped like the API's DatafileMetadata:

        { rowCount, columnInfo: [{ name, type, nullable, uniqueCount }] }

    - rowCount     number of data rows (the header is not counted).
    - type         a DataType enum value.
    - nullable     True if the column actually contains at least one null (empty cell).
    - uniqueCount  number of distinct non-null values (SQL's COUNT(DISTINCT ...); nulls are not counted).

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
