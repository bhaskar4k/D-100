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
    modifiedOn: string | null;
    isActive: boolean;
}

export interface DatasetPage {
    items: DatasetItem[];
    total: number;
    page: number;
    pageSize: number;
}

export interface DatasetColumnItem {
    id: number;
    columnName: string;
    type: number;
    nullable: boolean;
    uniqueCount: number;
}

export interface DatasetDetailItem {
    datasetUid: string;
    fileName: string;
    extension: string;
    fileSize: number;
    status: number;
    uploadInitiatedOn: string;
    uploadCompletedOn: string | null;
    uploadingTime: number | null;
    uploadedOn: string;
    rowCount: number | null;
    isProcessed: boolean;
    processingStatus: number;
    processingInitiatedOn: string | null;
    processingCompletedOn: string | null;
    processingTime: number | null;
    isActive: boolean;
    createdBy: number;
}

export interface DatasetDetailResult {
    dataset: DatasetDetailItem;
    columns: DatasetColumnItem[];
}
