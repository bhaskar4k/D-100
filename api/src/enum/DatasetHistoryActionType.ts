// String enum stored in T_DATASET_HISTORY.action_type. Values are the contract with any
// consumer that reads history rows; never rename, only add.
export enum DatasetHistoryActionType {
    MISSING_VALUE_HANDLING = "MISSING_VALUE_HANDLING",
    DUPLICATE_HANDLING = "DUPLICATE_HANDLING",
}
