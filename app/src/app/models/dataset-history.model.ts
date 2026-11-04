// Response shape for a MISSING_VALUE_HANDLING history row. Matches
// api/src/entity/DatasetHistoryEntity.ts -> MissingValueHandlingHistoryItem. The strategy is
// lifted out of the serialized states and resolved to its human-readable name, so neither
// previousState nor currentState carry replacement_strategy here.
export interface MissingValueHandlingHistoryItem {
    id: number;
    actionType: string;
    columnId: number;
    columnName: string | null;
    previousState: Record<string, unknown> | null;
    currentState: Record<string, unknown> | null;
    extraData: Record<string, unknown> | null;
    replacement_strategy_name: string | null;
    isActive: number;
    createdOn: string;
}

// Mirrors api/src/enum/DatasetHistoryActionType.ts. Values are the contract with the backend's
// `action_type` column; never rename, only add.
export const DatasetHistoryActionType = {
    MissingValueHandling: 'MISSING_VALUE_HANDLING',
    DuplicateHandling: 'DUPLICATE_HANDLING',
} as const;
