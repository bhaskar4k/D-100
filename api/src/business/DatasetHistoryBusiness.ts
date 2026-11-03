import { validate as IsValidUuid } from "uuid";
import { RowDataPacket } from "mysql2";
import { ConnectionPool } from "../data-access-layer/database";
import {
    DatasetHistoryRow,
    MissingValueHandlingHistoryItem,
    DatasetOwnerIdRow,
    StrategyNameRow
} from "../entity/DatasetHistoryEntity";
import { MissingValueHandlingStateEntity } from "../entity/audit/MissingValueHandlingEntity";
import { DatasetHistoryActionType } from "../enum/DatasetHistoryActionType";
import { SafeJsonParse } from "../util/JsonUtil";


// Pulls the strategy enum off a parsed state object. Returns null when the state is null,
// not an object, or missing the field — the caller then falls through to the other state.
function ExtractReplacementStrategyEnum(state: unknown): string | null {
    if (!state || typeof state !== "object" || Array.isArray(state)) {
        return null;
    }
    const value = (state as { replacement_strategy?: unknown }).replacement_strategy;
    return typeof value === "string" && value.length > 0 ? value : null;
}


// Returns a shallow copy of the state with `replacement_strategy` removed. The strategy is
// lifted to its own top-level field on the response, so the client doesn't need to look for
// it inside the serialized blob.
function StripReplacementStrategyField(state: unknown): unknown {
    if (!state || typeof state !== "object" || Array.isArray(state)) {
        return state;
    }
    const { replacement_strategy, ...rest } = state as MissingValueHandlingStateEntity & Record<string, unknown>;
    void replacement_strategy; // keeps TS from flagging the destructured var as unused
    return rest;
}


async function ResolveDatasetOwnership(DatasetUid: string, UserId: number): Promise<number | string> {
    if (!DatasetUid || !IsValidUuid(DatasetUid)) {
        return "A valid dataset identifier is required.";
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

    return Number(ownerRows[0].id);
}


export class DatasetHistoryBusiness {
    // Returns MISSING_VALUE_HANDLING history rows for a dataset the caller owns. The row's
    // previous/current serialized state matches `MissingValueHandlingStateEntity`; this method
    // lifts `replacement_strategy` out of each state, resolves it to its human-readable name
    // from the strategy master, and strips the field from the states so the client reads it
    // from a single top-level `replacement_strategy_name`.
    static async DoGetMissingValueHandlingHistory(
        UserId: number,
        DatasetUid: string
    ): Promise<MissingValueHandlingHistoryItem[] | string> {
        const datasetIdOrError = await ResolveDatasetOwnership(DatasetUid, UserId);
        if (typeof datasetIdOrError === "string") {
            return datasetIdOrError;
        }
        const datasetId = datasetIdOrError;

        const pool = await ConnectionPool;

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
            [datasetId, DatasetHistoryActionType.MISSING_VALUE_HANDLING]
        );

        // First pass: parse each row's JSON once and pull the strategy enum off the state so
        // we know which strategy names to resolve.
        const parsedRows = rows.map(row => {
            const previousState = SafeJsonParse(row.previous_state);
            const currentState = SafeJsonParse(row.current_state);
            // Both states carry the same strategy — the one that was applied — but currentState
            // is written after the fact so we prefer it; previousState is the fallback.
            const strategyEnum = ExtractReplacementStrategyEnum(currentState) ?? ExtractReplacementStrategyEnum(previousState);
            return { row, previousState, currentState, strategyEnum };
        });

        const strategyEnums = Array.from(
            new Set(
                parsedRows
                    .map(entry => entry.strategyEnum)
                    .filter((value): value is string => value !== null)
            )
        );

        // Resolve every strategy enum we need in one go. If a strategy was deactivated we
        // still want its name, so this ignores is_active.
        const strategyNameByEnum = new Map<string, string>();
        if (strategyEnums.length > 0) {
            const placeholders = strategyEnums.map(() => "?").join(", ");
            const [strategyRows] = await pool.query<StrategyNameRow[]>(
                `SELECT replacment_strategy_enum, replacement_strategy_name
                 FROM t_missing_value_replacement_strategy_master
                 WHERE replacment_strategy_enum IN (${placeholders})`,
                strategyEnums
            );
            for (const row of strategyRows) {
                strategyNameByEnum.set(row.replacment_strategy_enum, row.replacement_strategy_name);
            }
        }

        return parsedRows.map(({ row, previousState, currentState, strategyEnum }) => ({
            id: Number(row.id),
            datasetId: Number(row.dataset_id),
            actionType: row.action_type,
            columnId: Number(row.column_id),
            columnName: row.column_name,
            previousState: StripReplacementStrategyField(previousState),
            currentState: StripReplacementStrategyField(currentState),
            // Falls back to the enum string if the strategy row has been deleted — better to
            // show "MEAN" than nothing in that corner case.
            replacement_strategy_name: strategyEnum
                ? (strategyNameByEnum.get(strategyEnum) ?? strategyEnum)
                : null,
            isActive: Number(row.is_active),
            createdOn: row.created_on instanceof Date
                ? row.created_on.toISOString()
                : String(row.created_on),
        }));
    }
}
