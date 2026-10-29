export enum MissingValueStrategy {
    Mean = 1,
    Median = 2,
    Mode = 3,
    Min = 4,
    Max = 5,
    Constant = 6,
    ForwardFill = 7,
    BackwardFill = 8,
}

export const MISSING_VALUE_STRATEGY_LABEL: Record<number, string> = {
    [MissingValueStrategy.Mean]: 'Mean imputation',
    [MissingValueStrategy.Median]: 'Median imputation',
    [MissingValueStrategy.Mode]: 'Mode imputation',
    [MissingValueStrategy.Min]: 'Minimum-value imputation',
    [MissingValueStrategy.Max]: 'Maximum-value imputation',
    [MissingValueStrategy.Constant]: 'Constant-value imputation',
    [MissingValueStrategy.ForwardFill]: 'Forward fill',
    [MissingValueStrategy.BackwardFill]: 'Backward fill',
};

export const MISSING_VALUE_STRATEGY_OPTIONS: { id: number; text: string }[] = [
    { id: MissingValueStrategy.Mean, text: MISSING_VALUE_STRATEGY_LABEL[MissingValueStrategy.Mean] },
    { id: MissingValueStrategy.Median, text: MISSING_VALUE_STRATEGY_LABEL[MissingValueStrategy.Median] },
    { id: MissingValueStrategy.Mode, text: MISSING_VALUE_STRATEGY_LABEL[MissingValueStrategy.Mode] },
    { id: MissingValueStrategy.Min, text: MISSING_VALUE_STRATEGY_LABEL[MissingValueStrategy.Min] },
    { id: MissingValueStrategy.Max, text: MISSING_VALUE_STRATEGY_LABEL[MissingValueStrategy.Max] },
    { id: MissingValueStrategy.Constant, text: MISSING_VALUE_STRATEGY_LABEL[MissingValueStrategy.Constant] },
    { id: MissingValueStrategy.ForwardFill, text: MISSING_VALUE_STRATEGY_LABEL[MissingValueStrategy.ForwardFill] },
    { id: MissingValueStrategy.BackwardFill, text: MISSING_VALUE_STRATEGY_LABEL[MissingValueStrategy.BackwardFill] },
];
