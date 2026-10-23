export interface DatasetItem {
    datasetUid: string;
    fileName: string;
    extension: string;
    fileSize: number;
    status: number;
    uploadingTime: number | null;
    uploadedOn: string;
    isProcessed: boolean;
    processingStatus: number;
    processingTime: number | null;
    isActive: boolean;
}

export interface DatasetPage {
    items: DatasetItem[];
    total: number;
    page: number;
    pageSize: number;
}
