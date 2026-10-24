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
    modified_on: Date | null;
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
    modifiedOn: Date | null;
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
    is_processed: number;
    is_active: number;
}

export interface DatasetDetailRow extends RowDataPacket {
    id: number;
    dataset_uid: string;
    filename: string;
    extension: string;
    filesize: string | number;
    status: number;
    initiated_on: Date;
    upload_completed_on: Date | null;
    uploading_time: string | number | null;
    row_count: string | number | null;
    is_processed: number;
    processing_status: number;
    processing_initiated_on: Date | null;
    processing_completed_on: Date | null;
    processing_time: string | number | null;
    created_by: number;
    created_on: Date;
    modified_on: Date | null;
    is_active: number;
}

export interface DatasetColumnRow extends RowDataPacket {
    id: number;
    column_name: string;
    type: number;
    nullable: number;
    unique_count: string | number;
    modified_on: Date | null;
}

export interface DatasetColumnItem {
    id: number;
    columnName: string;
    type: number;
    nullable: boolean;
    uniqueCount: number;
    createdOn: Date | null;
    modifiedOn: Date | null;
}

export interface DatasetDetailItem {
    datasetUid: string;
    fileName: string;
    extension: string;
    fileSize: number;
    status: number;
    uploadInitiatedOn: Date;
    uploadCompletedOn: Date | null;
    uploadingTime: number | null;
    uploadedOn: Date;
    rowCount: number | null;
    isProcessed: boolean;
    processingStatus: number;
    processingInitiatedOn: Date | null;
    processingCompletedOn: Date | null;
    processingTime: number | null;
    modifiedOn: Date | null;
    isActive: boolean;
    createdBy: number;
}

export interface DatasetDetailResult {
    dataset: DatasetDetailItem;
    columns: DatasetColumnItem[];
}

export interface ColumnLookupRow extends RowDataPacket {
    column_name: string;
}