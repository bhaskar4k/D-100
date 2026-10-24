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
from ..registry import expose


@expose
def ConvertToParquet(SourcePath: str, TargetPath: str) -> BaseDto:
    """
    Reads SourcePath (CSV, Parquet, XLSX, XLS) and writes it to TargetPath as Parquet.
    Creates the target directory if it does not exist. The source file is left untouched.
    """
    if not os.path.isfile(SourcePath):
        return ErrorDto(False, "Source file not found.", 404)

    if not IsSupported(SourcePath):
        return ErrorDto(False, f"Unsupported source file type '{GetExtension(SourcePath)}'. Supported: {', '.join(SupportedExtensions)}", 400)

    if GetExtension(TargetPath) != ".parquet":
        return ErrorDto(False, "Target file must end with '.parquet'.", 400)

    try:
        os.makedirs(os.path.dirname(TargetPath) or ".", exist_ok=True)

        Lazy = ReadFileAsPolarsLazyFrame(SourcePath)

        # sink_parquet streams CSV/Parquet sources straight to disk without materializing them
        # in memory. Excel files are already materialized (polars has no scanner for them), so
        # the wrapping LazyFrame simply writes what is already in memory.
        Lazy.sink_parquet(TargetPath)

    except Exception as error:
        return ErrorDto(False, f"Could not convert the file: {error}", 422)

    return SuccessDto(True, "File converted to Parquet.", 200)
