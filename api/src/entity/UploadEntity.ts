export interface UploadInitiateResult {
    uploadId: string;
    chunkSize: number;
    totalChunks: number;
}

export interface UploadSession {
    userId: string;
    extension: string;
    fileSize: number;
    chunkSize: number;
    totalChunks: number;
}
