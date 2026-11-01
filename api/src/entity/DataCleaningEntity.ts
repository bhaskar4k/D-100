import { RowDataPacket } from "mysql2";
import { DataType } from "../enum/DataType";

export interface MissingValueReplacementStrategyItem {
    id: number;
    replacementStrategyName: string;
    replacmentStrategyEnum: string;
    replacmentStrategyDescription: string;
    isActive: number;
    allowedDatatypeToBePerformedOn: DataType[];
}

export interface MissingValueReplacementStrategyRow extends RowDataPacket {
    id: number;
    replacement_strategy_name: string;
    replacment_strategy_enum: string;
    replacment_strategy_description: string;
    is_active: number;
}

export interface HandleMissingValueRequest {
    datasetUid: string;
    columnId: number;
    strategyId: number;
    constantValue: string | null;
}

export interface MissingValueHandlingQueuePayload {
    datasetId: number;
    datasetUid: string;
    columnName: string;
    columnType: number;
    strategyEnum: string;
    constantValue: string | null;
}

export interface DatasetUidRow extends RowDataPacket {
    id: number;
    dataset_uid: string;
    created_by: number;
    is_processed: number;
    processing_status: number;
}

export interface ColumnByIdRow extends RowDataPacket {
    id: number;
    dataset_id: number;
    column_name: string;
    type: number;
    nullable: number;
}

export interface StrategyByIdRow extends RowDataPacket {
    id: number;
    replacment_strategy_enum: string;
    is_active: number;
}
