import path from "path";


export function GetAllowedExtensions(): string[] {
    return (process.env.UPLOAD_ALLOWED_EXTENSIONS || ".xlsx,.xls,.csv,.parquet")
        .split(",")
        .map((extension) => extension.trim().toLowerCase())
        .filter(Boolean)
        .map((extension) => (extension.startsWith(".") ? extension : `.${extension}`));
}


export function BuildRawFilePath(DatasetUid: string, RAW_UPLOAD_PATH: string, UploadedFileName: string, Extension: string): string {
    return path.join(path.resolve(RAW_UPLOAD_PATH!), DatasetUid, `${UploadedFileName}${Extension}`);
}


export function BuildIngestFilePath(DatasetUid: string, INGEST_UPLOAD_PATH: string, UploadedFileName: string): string {
    return path.join(path.resolve(INGEST_UPLOAD_PATH!), DatasetUid, `${UploadedFileName}.parquet`);
}


// Each user+dataset gets a dedicated scratch folder for its latest download. The folder is
// wiped by Python on every GenerateDownloadableDatasetFile call, so a previous download for
// one format cannot leak into the next download for another.
export function BuildDownloadFolderPath(DOWNLOAD_TEMP_PATH: string, UserId: number, DatasetUid: string): string {
    return path.join(path.resolve(DOWNLOAD_TEMP_PATH!), String(UserId), String(DatasetUid), "IngestedDataset");
}


// The dataset's filename stored in T_DATASET may contain characters that are legal on this
// machine but awkward in a Content-Disposition header or on a different OS. This strips the
// path separators and the Windows-reserved chars so the generated artifact name is portable.
export function SanitizeDownloadBaseName(RawName: string): string {
    const Cleaned = (RawName ?? "").trim().replace(/[\\/:*?"<>|\x00-\x1f]/g, "_");
    return Cleaned.length > 0 ? Cleaned : "dataset";
}