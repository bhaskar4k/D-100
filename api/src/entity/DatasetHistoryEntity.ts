import { RowDataPacket } from "mysql2";

export interface DatasetHistoryRow extends RowDataPacket {
    id: number;
    dataset_id: number;
    action_type: string;
    column_id: number;
    column_name: string | null;
    previous_state: string;
    current_state: string;
    is_active: number;
    created_on: Date | string;
}

// Response shape for a MISSING_VALUE_HANDLING history row. The strategy is lifted out of the
// serialized state and resolved to its human-readable name against the master table; the
// serialized states no longer carry replacement_strategy at this layer.
export interface MissingValueHandlingHistoryItem {
    id: number;
    datasetId: number;
    actionType: string;
    columnId: number;
    columnName: string | null;
    previousState: unknown;
    currentState: unknown;
    replacement_strategy_name: string | null;
    isActive: number;
    createdOn: Date | string;
}

export interface DatasetOwnerIdRow extends RowDataPacket {
    id: number;
    created_by: number;
}

export interface StrategyNameRow extends RowDataPacket {
    replacment_strategy_enum: string;
    replacement_strategy_name: string;
}