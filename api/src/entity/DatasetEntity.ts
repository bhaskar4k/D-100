import { RowDataPacket } from "mysql2";

export interface DatasetRow extends RowDataPacket {
    dataset_uid: string;
    filename: string;
    extension: string;
    filesize: string | number;
    status: number;
    created_on: Date;
    is_processed: number;
    processing_status: number;
    processing_completed_on: Date | null;
    is_active: number;
}

export interface DatasetItem {
    datasetUid: string;
    fileName: string;
    extension: string;
    fileSize: number;
    status: number;
    uploadedOn: Date;
    isProcessed: boolean;
    processingStatus: number;
    processingCompletedOn: Date | null;
    isActive: boolean;
}

export interface DatasetPage {
    items: DatasetItem[];
    total: number;
    page: number;
    pageSize: number;
}

export interface DatasetCountRow extends RowDataPacket {
    total: number;
}

export interface DatafileMetadata {
    rowCount: number;
    columnInfo: DatafileColumnMetadata[];
}

export interface DatafileColumnMetadata {
    name: string;
    type: number;
    nullable: boolean;
    uniqueCount: number;
}

export interface DatasetOwnerRow extends RowDataPacket {
    id: number;
    created_by: number;
    status: number;
    processing_status: number;
}
