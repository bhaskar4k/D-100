"""Reads supported data files with polars."""

import os
import polars as pl

SupportedExtensions = (".csv", ".parquet", ".xlsx", ".xls")


def GetExtension(path: str) -> str:
    return os.path.splitext(path)[1].lower()


def IsSupported(path: str) -> bool:
    return GetExtension(path) in SupportedExtensions


def ReadFileAsPolarsLazyFrame(path: str) -> pl.LazyFrame:
    extension = GetExtension(path)

    if extension == ".csv":
        return pl.scan_csv(path)

    if extension == ".parquet":
        return pl.scan_parquet(path)

    if extension in (".xlsx", ".xls"):
        return pl.read_excel(path).lazy()

    raise ValueError(f"Unsupported file type '{extension}'. Supported: {', '.join(SupportedExtensions)}")


def ReadFileAsPolarsDataFrame(path: str) -> pl.DataFrame:
    """Reads a whole file into memory as a DataFrame."""
    return ReadFileAsPolarsLazyFrame(path).collect()
