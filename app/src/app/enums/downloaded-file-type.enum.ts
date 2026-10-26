// Mirrors api/src/enum/DownloadedFileType.ts and the DownloadedFileType enum used in
// pyd-100's download writer. The numeric values are the contract across all three layers;
// never renumber, only add.
export enum DownloadedFileType {
    Excel = 1,
    CSV = 2,
    Parquet = 3,
}

export const DOWNLOADED_FILE_TYPE_LABEL: Record<number, { label: string; extension: string; icon: string }> = {
    [DownloadedFileType.Excel]: { label: 'Excel', extension: '.xlsx', icon: 'bi-file-earmark-excel-fill text-success' },
    [DownloadedFileType.CSV]: { label: 'CSV', extension: '.csv', icon: 'bi-filetype-csv text-primary' },
    [DownloadedFileType.Parquet]: { label: 'Parquet', extension: '.parquet', icon: 'bi-file-earmark-binary-fill text-warning' },
};
