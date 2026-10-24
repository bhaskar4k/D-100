// Mirrors api/src/enum/DataType.ts and pyd-100/src/pyd_100/enums/data_type.py. The numeric
// values are the contract across all three layers: never renumber, only add.
export enum DataType {
    Integer = 1,
    Float = 2,
    String = 3,
    Boolean = 4,
    Date = 5,
    DateTime = 6,
    Time = 7,
    Duration = 8,
    Decimal = 9,
    Binary = 10,
    Categorical = 11,
    List = 12,
    Struct = 13,
    Null = 14,
    Unknown = 99,
}

export const DATA_TYPE_LABEL: Record<number, { label: string; color: string }> = {
    [DataType.Integer]: { label: 'Integer', color: 'type-integer' },
    [DataType.Float]: { label: 'Float', color: 'type-float' },
    [DataType.String]: { label: 'String', color: 'type-string' },
    [DataType.Boolean]: { label: 'Boolean', color: 'type-boolean' },
    [DataType.Date]: { label: 'Date', color: 'type-date' },
    [DataType.DateTime]: { label: 'DateTime', color: 'type-datetime' },
    [DataType.Time]: { label: 'Time', color: 'type-time' },
    [DataType.Duration]: { label: 'Duration', color: 'type-duration' },
    [DataType.Decimal]: { label: 'Decimal', color: 'type-decimal' },
    [DataType.Binary]: { label: 'Binary', color: 'type-binary' },
    [DataType.Categorical]: { label: 'Categorical', color: 'type-categorical' },
    [DataType.List]: { label: 'List', color: 'type-list' },
    [DataType.Struct]: { label: 'Struct', color: 'type-struct' },
    [DataType.Null]: { label: 'Null', color: 'type-null' },
    [DataType.Unknown]: { label: 'Unknown', color: 'type-unknown' },
};
