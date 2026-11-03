import { validate as IsValidUuid } from "uuid";
import { RowDataPacket } from "mysql2";
import { ConnectionPool } from "../data-access-layer/database";
import { DatasetHistoryItem, DatasetHistoryRow } from "../entity/DatasetHistoryEntity";
import { DatasetHistoryActionType } from "../enum/DatasetHistoryActionType";
import { Logger } from "../log/Logger";


interface DatasetOwnerIdRow extends RowDataPacket {
    id: number;
    created_by: number;
}


function SafeJsonParse(value: string): unknown {
    try {
        return JSON.parse(value);
    } catch (error) {
        // A corrupt row should not break the whole page; log it and surface a null so the UI
        // renders "no data" for just this cell.
        void Logger.Error(`Failed to parse history state JSON: '${value}'`, error);
        return null;
    }
}


export class DatasetHistoryBusiness {
    // Returns dataset-history rows filtered by action_type. Validates ownership so one user
    // never sees another user's dataset history. Returns an error-message string if the
    // request can't proceed.
    static async DoGetHistory(
        UserId: number,
        DatasetUid: string,
        ActionType: string
    ): Promise<DatasetHistoryItem[] | string> {
        if (!DatasetUid || !IsValidUuid(DatasetUid)) {
            return "A valid dataset identifier is required.";
        }

        const validActionTypes = new Set<string>(Object.values(DatasetHistoryActionType));
        if (!ActionType || !validActionTypes.has(ActionType)) {
            return "A valid action type is required.";
        }

        const pool = await ConnectionPool;

        const [ownerRows] = await pool.query<DatasetOwnerIdRow[]>(
            `SELECT id, created_by
             FROM T_DATASET
             WHERE dataset_uid = ? AND is_active = 1
             LIMIT 1`,
            [DatasetUid]
        );

        if (ownerRows.length === 0) {
            return "Dataset not found.";
        }

        if (Number(ownerRows[0].created_by) !== Number(UserId)) {
            return "You do not have access to this dataset.";
        }

        const datasetId = Number(ownerRows[0].id);

        // Left join against T_COLUMN so the UI gets a human-readable column name without
        // another round-trip. The join is left-joined because a column may have been deleted
        // after a history row was written, and we still want to show the old action.
        const [rows] = await pool.query<DatasetHistoryRow[]>(
            `SELECT h.id,
                    h.dataset_id,
                    h.action_type,
                    h.column_id,
                    c.column_name,
                    h.previous_state,
                    h.current_state,
                    h.is_active,
                    h.created_on
             FROM T_DATASET_HISTORY h
             LEFT JOIN T_COLUMN c ON c.id = h.column_id
             WHERE h.dataset_id = ?
               AND h.action_type = ?
               AND h.is_active = 1
             ORDER BY h.created_on DESC, h.id DESC`,
            [datasetId, ActionType]
        );

        return rows.map(row => ({
            id: Number(row.id),
            datasetId: Number(row.dataset_id),
            actionType: row.action_type,
            columnId: Number(row.column_id),
            columnName: row.column_name,
            previousState: SafeJsonParse(row.previous_state),
            currentState: SafeJsonParse(row.current_state),
            isActive: Number(row.is_active),
            createdOn: row.created_on instanceof Date
                ? row.created_on.toISOString()
                : String(row.created_on),
        }));
    }
}
