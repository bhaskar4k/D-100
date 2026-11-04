import { RowDataPacket } from "mysql2";

export interface DatasetHistoryRow extends RowDataPacket {
    id: number;
    dataset_id: number;
    action_type: string;
    column_id: number;
    column_name: string | null;
    previous_state: string;
    current_state: string;
    extra_data: string | null;
    is_active: number;
    created_on: Date | string;
}

// Response shape for a MISSING_VALUE_HANDLING history row. The strategy now lives on
// `extra_data` (not inside the column-state snapshot) and is additionally resolved to a
// human-readable name against the strategy master.
export interface MissingValueHandlingHistoryItem {
    id: number;
    datasetId: number;
    actionType: string;
    columnId: number;
    columnName: string | null;
    previousState: unknown;
    currentState: unknown;
    extraData: unknown;
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