// Mirrors pyd-100/src/pyd_100/enums/data_type.py. The numbers are a contract with the Python package:
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
