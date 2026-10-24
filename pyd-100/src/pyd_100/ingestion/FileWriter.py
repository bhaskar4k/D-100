"""Converts any supported data file to Parquet.

Parquet is the canonical on-disk format for downstream analytics in this project: columnar,
typed, compressed, and read-cheaply by polars. The RAW folder keeps the original upload (CSV,
XLSX, parquet) exactly as the user sent it; INGEST stores a parquet mirror the rest of the
pipeline consumes.
"""

import os

from .DataReader import (
    GetExtension,
    IsSupported,
    ReadFileAsPolarsLazyFrame,
    SupportedExtensions,
)
from ..dto import BaseDto, ErrorDto, SuccessDto
from ..enums import HttpStatusCode
from ..registry import expose


@expose
def ConvertToParquet(SourcePath: str, TargetPath: str) -> BaseDto:
    """
    Reads SourcePath (CSV, Parquet, XLSX, XLS) and writes it to TargetPath as Parquet.
    Creates the target directory if it does not exist. The source file is left untouched.
    """
    if not os.path.isfile(SourcePath):
        return ErrorDto(False, "Source file not found.", HttpStatusCode.NOT_FOUND)

    if not IsSupported(SourcePath):
        return ErrorDto(
            False,
            f"Unsupported source file type '{GetExtension(SourcePath)}'. Supported: {', '.join(SupportedExtensions)}",
            HttpStatusCode.BAD_REQUEST,
        )

    if GetExtension(TargetPath) != ".parquet":
        return ErrorDto(False, "Target file must end with '.parquet'.", HttpStatusCode.BAD_REQUEST)

    try:
        os.makedirs(os.path.dirname(TargetPath) or ".", exist_ok=True)

        Lazy = ReadFileAsPolarsLazyFrame(SourcePath)

        # sink_parquet streams CSV/Parquet sources straight to disk without materializing them
        # in memory. Excel files are already materialized (polars has no scanner for them), so
        # the wrapping LazyFrame simply writes what is already in memory.
        Lazy.sink_parquet(TargetPath)

    except Exception as error:
        return ErrorDto(False, f"Could not convert the file: {error}", HttpStatusCode.UNPROCESSABLE_ENTITY)

    return SuccessDto(True, "File converted to Parquet.", HttpStatusCode.OK)


@expose
def DeleteColumnFromParquet(FilePath: str, ColumnName: str) -> BaseDto:
    """Drops ColumnName from the parquet at FilePath and rewrites it in place.

    Writes to a sibling .tmp file first and then atomically replaces the original with
    os.replace, so a crash mid-write cannot leave the file half-written. The temp file is
    cleaned up on any failure path.
    """
    if not os.path.isfile(FilePath):
        return ErrorDto(False, "File not found.", HttpStatusCode.NOT_FOUND)

    if GetExtension(FilePath) != ".parquet":
        return ErrorDto(False, "Only .parquet files are supported for column removal.", HttpStatusCode.BAD_REQUEST)

    if not ColumnName or not ColumnName.strip():
        return ErrorDto(False, "Column name is required.", HttpStatusCode.BAD_REQUEST)

    TempPath = FilePath + ".tmp"

    try:
        Lazy = ReadFileAsPolarsLazyFrame(FilePath)
        Schema = Lazy.collect_schema()
        ColumnNames = Schema.names()

        if ColumnName not in ColumnNames:
            return ErrorDto(
                False,
                f"Column '{ColumnName}' not found in file.",
                HttpStatusCode.NOT_FOUND,
            )

        if len(ColumnNames) <= 1:
            return ErrorDto(
                False,
                "Cannot delete the last remaining column.",
                HttpStatusCode.BAD_REQUEST,
            )

        Lazy.drop(ColumnName).sink_parquet(TempPath)
        os.replace(TempPath, FilePath)
    except Exception as error:
        if os.path.exists(TempPath):
            try:
                os.remove(TempPath)
            except OSError:
                pass

        return ErrorDto(
            False,
            f"Could not drop the column: {error}",
            HttpStatusCode.UNPROCESSABLE_ENTITY,
        )

    return SuccessDto(
        {"filePath": FilePath, "columnName": ColumnName},
        "Column removed from file.",
        HttpStatusCode.OK,
    )
