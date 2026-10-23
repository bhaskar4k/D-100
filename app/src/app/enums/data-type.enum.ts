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

export const DATA_TYPE_LABEL: Record<number, string> = {
    [DataType.Integer]: 'Integer',
    [DataType.Float]: 'Float',
    [DataType.String]: 'String',
    [DataType.Boolean]: 'Boolean',
    [DataType.Date]: 'Date',
    [DataType.DateTime]: 'DateTime',
    [DataType.Time]: 'Time',
    [DataType.Duration]: 'Duration',
    [DataType.Decimal]: 'Decimal',
    [DataType.Binary]: 'Binary',
    [DataType.Categorical]: 'Categorical',
    [DataType.List]: 'List',
    [DataType.Struct]: 'Struct',
    [DataType.Null]: 'Null',
    [DataType.Unknown]: 'Unknown',
};
