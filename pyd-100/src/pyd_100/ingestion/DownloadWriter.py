"""Builds the downloadable artifacts for a processed dataset.

CSV and Parquet are a single pass from the INGEST parquet to a sibling file in a scratch
folder. Excel is written in slices of at most 1_000_000 rows per workbook because that is
below Excel's 1,048,576 hard row cap, so a 3M-row dataset produces three full chunks plus
one tail chunk. The destination folder is wiped before every run so a previous download
never leaks into the current one.
"""

import os
import shutil

import polars as pl

from .DataReader import GetExtension, IsSupported, ReadFileAsPolarsLazyFrame, SupportedExtensions
from ..dto import BaseDto, ErrorDto, SuccessDto
from ..enums import HttpStatusCode
from ..registry import expose


# Excel's hard limit is 1,048,576; we pick a round 1,000,000 so a count/limit mismatch cannot
# push the final chunk past the cap, and so the file naming matches the "1 million per file"
# contract the caller advertises.
ExcelChunkRowCount = 1_000_000

# Mirror of api/src/enum/DownloadedFileType.ts and the Angular enum of the same name.
# Values are the contract between the Node API, this package and the UI; never renumber.
FileTypeExcel = 1
FileTypeCsv = 2
FileTypeParquet = 3


def _ResetFolder(DestinationFolderpath: str) -> None:
    """Clears DestinationFolderpath so a previous download cannot leak into this one."""
    if os.path.isdir(DestinationFolderpath):
        # shutil.rmtree removes the folder itself; recreate it immediately so later writes
        # do not need to care whether this helper reset or created it.
        shutil.rmtree(DestinationFolderpath)

    os.makedirs(DestinationFolderpath, exist_ok=True)


def _WriteExcelChunks(Lazy: pl.LazyFrame, DestinationFolderpath: str, GeneratedFileName: str) -> list[str]:
    """Writes the LazyFrame into one-million-row .xlsx chunks and returns the file names.

    Row count is computed once up front so we know how many chunks to produce without
    materializing the frame. Each chunk slice is collected on its own so only one chunk
    is in memory at a time; this is important for datasets with tens of millions of rows.
    """
    Total = Lazy.select(pl.len()).collect().item()

    # An empty dataset still gets one (empty) chunk so the caller always has a file to serve.
    ChunkCount = max(1, (Total + ExcelChunkRowCount - 1) // ExcelChunkRowCount)
    FileNames: list[str] = []

    for Index in range(ChunkCount):
        Offset = Index * ExcelChunkRowCount
        FileName = f"{GeneratedFileName} - Chunk {Index + 1}.xlsx"
        FilePath = os.path.join(DestinationFolderpath, FileName)

        Chunk = Lazy.slice(Offset, ExcelChunkRowCount).collect()
        Chunk.write_excel(FilePath)
        FileNames.append(FileName)

    return FileNames


@expose
def GenerateDownloadableIngestedDatasetFile(
    IngestDatasetFilepath: str,
    DestinationFolderpath: str,
    GeneratedFileName: str,
    DownloadedFileType: int = FileTypeExcel,
) -> BaseDto:
    """Produces the files the HTTP layer will stream for a dataset download.

    DownloadedFileType uses the shared enum: Excel = 1, CSV = 2, Parquet = 3.
    Returns the list of file names (just the leafs, not the full path) created inside
    DestinationFolderpath, plus the format label — so the Node side knows whether to
    serve a single file or zip the folder.
    """
    if not os.path.isfile(IngestDatasetFilepath):
        return ErrorDto(None, "Source dataset file not found.", HttpStatusCode.NOT_FOUND)

    if not IsSupported(IngestDatasetFilepath):
        return ErrorDto(
            None,
            f"Unsupported source file type '{GetExtension(IngestDatasetFilepath)}'. Supported: {', '.join(SupportedExtensions)}",
            HttpStatusCode.BAD_REQUEST,
        )

    if not DestinationFolderpath or not DestinationFolderpath.strip():
        return ErrorDto(None, "Destination folder path is required.", HttpStatusCode.BAD_REQUEST)

    if not GeneratedFileName or not GeneratedFileName.strip():
        return ErrorDto(None, "Generated file name is required.", HttpStatusCode.BAD_REQUEST)

    # Guard against path separators sneaking in through the generated name so the file never
    # escapes DestinationFolderpath.
    if any(Char in GeneratedFileName for Char in ("/", "\\", "..")):
        return ErrorDto(None, "Generated file name contains invalid characters.", HttpStatusCode.BAD_REQUEST)

    try:
        _ResetFolder(DestinationFolderpath)
        Lazy = ReadFileAsPolarsLazyFrame(IngestDatasetFilepath)

        if DownloadedFileType == FileTypeCsv:
            FileName = f"{GeneratedFileName}.csv"
            # sink_csv streams one row group at a time, which keeps memory flat for very large datasets.
            Lazy.sink_csv(os.path.join(DestinationFolderpath, FileName))
            Payload = {"files": [FileName], "format": "csv"}

        elif DownloadedFileType == FileTypeParquet:
            FileName = f"{GeneratedFileName}.parquet"
            Lazy.sink_parquet(os.path.join(DestinationFolderpath, FileName))
            Payload = {"files": [FileName], "format": "parquet"}

        elif DownloadedFileType == FileTypeExcel:
            FileNames = _WriteExcelChunks(Lazy, DestinationFolderpath, GeneratedFileName)
            Payload = {"files": FileNames, "format": "excel"}

        else:
            return ErrorDto(
                None,
                f"Unknown DownloadedFileType '{DownloadedFileType}'. Expected 1 (Excel), 2 (CSV) or 3 (Parquet).",
                HttpStatusCode.BAD_REQUEST,
            )

    except Exception as error:  # noqa: BLE001 - propagate as a response, never as a crash
        return ErrorDto(
            None,
            f"Could not generate the download file: {error}",
            HttpStatusCode.UNPROCESSABLE_ENTITY,
        )

    return SuccessDto(Payload, "Download file(s) generated.", HttpStatusCode.OK)
