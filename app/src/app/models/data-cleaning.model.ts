export interface MissingValueReplacementStrategyItem {
    id: number;
    replacementStrategyName: string;
    replacmentStrategyEnum: string;
    replacmentStrategyDescription: string;
    isActive: number;
    allowedDatatypeToBePerformedOn: number[];
}

export const MissingValueReplacementStrategyEnum = {
    Mean: 'MEAN',
    Median: 'MEDIAN',
    Mode: 'MODE',
    Min: 'MIN',
    Max: 'MAX',
    Constant: 'CONSTANT',
    ForwardFill: 'FORWARD_FILL',
    BackwardFill: 'BACKWARD_FILL',
} as const;

export interface HandleMissingValuePayload {
    datasetUid: string;
    columnId: number;
    strategyId: number;
    constantValue: string | null;
}
