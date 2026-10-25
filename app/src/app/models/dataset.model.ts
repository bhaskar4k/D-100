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
    autoDeletionTime: number | null;
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
    createdOn: string | null;
    modifiedOn: string | null;
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
    modifiedOn: string | null;
    isActive: boolean;
    createdBy: number;
}

export interface DatasetDetailResult {
    dataset: DatasetDetailItem;
    columns: DatasetColumnItem[];
}

export interface DatasetPreviewColumn {
    id: number;
    columnName: string;
    type: number;
    nullable: boolean;
    uniqueCount: number;
}

export interface DatasetPreviewResult {
    datasetUid: string;
    fileName: string;
    extension: string;
    columns: DatasetPreviewColumn[];
    rows: Record<string, unknown>[];
    rowCount: number;
    topN: number;
}
