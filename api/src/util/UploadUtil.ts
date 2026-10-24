import path from "path";


export function GetAllowedExtensions(): string[] {
    return (process.env.UPLOAD_ALLOWED_EXTENSIONS || ".xlsx,.xls,.csv,.parquet")
        .split(",")
        .map((extension) => extension.trim().toLowerCase())
        .filter(Boolean)
        .map((extension) => (extension.startsWith(".") ? extension : `.${extension}`));
}


export function BuildIngestFilePath(DatasetUid: string, INGEST_UPLOAD_PATH: string, UploadedFileName: string): string {
    return path.join(path.resolve(INGEST_UPLOAD_PATH!), DatasetUid, `${UploadedFileName}.parquet`);
}