export function GetAllowedExtensions(): string[] {
    return (process.env.UPLOAD_ALLOWED_EXTENSIONS || ".xlsx,.xls,.csv,.parquet")
        .split(",")
        .map((extension) => extension.trim().toLowerCase())
        .filter(Boolean)
        .map((extension) => (extension.startsWith(".") ? extension : `.${extension}`));
}
