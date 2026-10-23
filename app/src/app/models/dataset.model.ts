export interface DatasetItem {
    datasetUid: string;
    fileName: string;
    extension: string;
    fileSize: number;
    status: number;
    uploadedOn: string;
    isProcessed: boolean;
    processingStatus: number;
    processingCompletedOn: string | null;
    isActive: boolean;
}

export interface DatasetPage {
    items: DatasetItem[];
    total: number;
    page: number;
    pageSize: number;
}
