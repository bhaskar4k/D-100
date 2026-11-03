export interface DatasetHistoryItem {
    id: number;
    datasetId: number;
    actionType: string;
    columnId: number;
    columnName: string | null;
    previousState: Record<string, unknown> | null;
    currentState: Record<string, unknown> | null;
    isActive: number;
    createdOn: string;
}

// Mirrors api/src/enum/DatasetHistoryActionType.ts. Values are the contract with the backend's
// `action_type` column; never rename, only add.
export const DatasetHistoryActionType = {
    MissingValueHandling: 'MISSING_VALUE_HANDLING',
    DuplicateHandling: 'DUPLICATE_HANDLING',
} as const;
