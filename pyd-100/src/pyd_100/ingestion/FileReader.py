import os

import polars as pl

from .DataReader import (
    GetExtension,
    IsSupported,
    ReadFileAsPolarsLazyFrame,
    SupportedExtensions,
)
from ..dto import BaseDto, ErrorDto, SuccessDto
from ..registry import expose

PreviewRows = 5


@expose
def GetFileMetadata(FilePath: str) -> BaseDto:
    """Schema, row count and a small preview of a data file (everything JSON-friendly)."""
    if not os.path.isfile(FilePath):
        return ErrorDto(None, "File not found.", 404, {"FilePath": FilePath})

    if not IsSupported(FilePath):
        return ErrorDto(
            None,
            f"Unsupported file type '{GetExtension(FilePath)}'. Supported: {', '.join(SupportedExtensions)}",
            400,
            {"FilePath": FilePath},
        )

    Lazy = ReadFileAsPolarsLazyFrame(FilePath)
    Schema = Lazy.collect_schema()

    return SuccessDto(
        {
            "FilePath": FilePath,
            "Extension": GetExtension(FilePath),
            "FileSize": os.path.getsize(FilePath),
            "RowCount": Lazy.select(pl.len()).collect().item(),
            "ColumnCount": len(Schema),
            "Columns": [{"Name": Name, "Type": str(Type)} for Name, Type in Schema.items()],
            "Preview": Lazy.head(PreviewRows).collect().to_dicts(),
        },
        "File metadata retrieved.",
        200,
    )
