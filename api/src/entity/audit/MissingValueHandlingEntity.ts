// Snapshot of a T_COLUMN row written into T_DATASET_HISTORY.previous_state /
// current_state as JSON for a MISSING_VALUE_HANDLING action. The shape is the contract
// with any consumer that reads history rows; add fields with care, never remove.
export interface MissingValueHandlingStateEntity {
    datatype: number;
    nullable: boolean;
    unique_count: number;
    null_value_count: number;
}


// Serialized into T_DATASET_HISTORY.extra_data for a MISSING_VALUE_HANDLING action. Holds
// the applied strategy and, when the strategy is CONSTANT, the user-provided value — the
// bits of context that describe "what we did" rather than "what the column looked like".
export interface MissingValueHandlingExtraData {
    replacement_strategy: string;
    constant_value: string | null;
}
