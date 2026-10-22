export enum FileUploadStatus {
    INIT = 1,
    UPLOADING = 2,
    COMPLETED = 3,
}

export const FILE_UPLOAD_STATUS_LABEL: Record<number, { label: string; color: string }> = {
    [FileUploadStatus.INIT]: { label: 'Initiated', color: 'status-init' },
    [FileUploadStatus.UPLOADING]: { label: 'Uploading', color: 'status-uploading' },
    [FileUploadStatus.COMPLETED]: { label: 'Completed', color: 'status-completed' },
};
