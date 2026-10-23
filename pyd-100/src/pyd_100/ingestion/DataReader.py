"""Reads supported data files with polars.

Metadata has to be exact, so files are read with settings that never guess from a sample:
column types are inferred from every row (polars' default looks at only the first 100 rows, which
would mistype a column that changes at row 101), and nothing is silently dropped.
"""

import os

import polars as pl

SupportedExtensions = (".csv", ".parquet", ".xlsx", ".xls")


def GetExtension(path: str) -> str:
    return os.path.splitext(path)[1].lower()


def IsSupported(path: str) -> bool:
    return GetExtension(path) in SupportedExtensions


def ReadFileAsPolarsLazyFrame(path: str) -> pl.LazyFrame:
    """Opens a file as a LazyFrame, choosing the reader from the file extension.

    CSV and Parquet are scanned lazily (nothing is loaded until collected), which matters for huge
    files. Excel has no lazy reader, so it is loaded and wrapped.
    """
    extension = GetExtension(path)

    if extension == ".csv":
        return pl.scan_csv(
            path,
            infer_schema_length=None,  # infer each column's type from every row, not a 100-row sample
            try_parse_dates=True,      # ISO dates / datetimes become Date / Datetime instead of String
        )

    if extension == ".parquet":
        return pl.scan_parquet(path)   # types are stored in the file, nothing to infer

    if extension in (".xlsx", ".xls"):
        return pl.read_excel(
            path,
            infer_schema_length=None,  # infer from every row, not a 100-row sample
            drop_empty_rows=False,     # keep blank rows so the row count matches the sheet
            drop_empty_cols=False,     # keep empty columns so no column goes unreported
        ).lazy()

    raise ValueError(f"Unsupported file type '{extension}'. Supported: {', '.join(SupportedExtensions)}")


def ReadFileAsPolarsDataFrame(path: str) -> pl.DataFrame:
    """Reads a whole file into memory as a DataFrame."""
    return ReadFileAsPolarsLazyFrame(path).collect()
