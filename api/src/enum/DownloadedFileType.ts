// Mirrors app/src/app/enums/downloaded-file-type.enum.ts and the DownloadedFileType enum used in
// pyd-100's download writer. Values are the contract across all three layers; never renumber.
export enum DownloadedFileType {
    Excel = 1,
    CSV = 2,
    Parquet = 3,
}
