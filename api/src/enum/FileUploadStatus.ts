export enum FileUploadStatus {
    INIT = 1,
    UPLOADING = 2,
    COMPLETED = 3,
}

export const StatusLabels: Record<string, FileUploadStatus> = {
    initiated: FileUploadStatus.INIT,
    uploading: FileUploadStatus.UPLOADING,
    completed: FileUploadStatus.COMPLETED
};