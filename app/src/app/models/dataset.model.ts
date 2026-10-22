export interface DatasetItem {
    datasetUid: string;
    fileName: string;
    extension: string;
    fileSize: number;
    status: number;
    uploadInitiatedOn: string;
    uploadCompletedOn: string | null;
    uploadingTime: number | null;
    uploadedOn: string;
}

export interface DatasetPage {
    items: DatasetItem[];
    total: number;
    page: number;
    pageSize: number;
}
