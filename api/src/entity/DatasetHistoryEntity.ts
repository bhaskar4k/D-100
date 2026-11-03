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

export interface DatasetHistoryItem {
    id: number;
    datasetId: number;
    actionType: string;
    columnId: number;
    columnName: string | null;
    previousState: unknown;
    currentState: unknown;
    isActive: number;
    createdOn: string;
}
