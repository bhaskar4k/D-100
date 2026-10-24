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
