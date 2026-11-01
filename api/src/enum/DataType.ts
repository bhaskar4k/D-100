// never renumber, only add.
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

export const NUMERIC_TYPES: DataType[] = [DataType.Integer, DataType.Float, DataType.Decimal];

export const ORDERED_TYPES: DataType[] = [
    DataType.Integer,
    DataType.Float,
    DataType.Decimal,
    DataType.Date,
    DataType.DateTime,
    DataType.Time,
    DataType.Duration
];

export const ANY_SCALAR_TYPES: DataType[] = [
    DataType.Integer,
    DataType.Float,
    DataType.Decimal,
    DataType.String,
    DataType.Boolean,
    DataType.Date,
    DataType.DateTime,
    DataType.Time,
    DataType.Duration,
    DataType.Categorical
];