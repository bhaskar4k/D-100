from enum import IntEnum

import polars as pl


class DataType(IntEnum):
    """Column data types reported in file metadata.

    The numeric values are part of the contract with the Node API (api/src/enum/DataType.ts) and are
    stored/sent as numbers, so never renumber them; only add new ones.
    """

    Integer = 1      # Int8..Int64 / UInt8..UInt64
    Float = 2        # Float32 / Float64
    String = 3
    Boolean = 4
    Date = 5
    DateTime = 6     # with or without a time zone
    Time = 7
    Duration = 8
    Decimal = 9      # exact fixed-point numbers
    Binary = 10
    Categorical = 11  # Categorical / Enum
    List = 12        # List / Array
    Struct = 13
    Null = 14        # a column that contains nothing but nulls and has no other type
    Unknown = 99     # anything not listed above


def FromPolarsDtype(dtype: pl.DataType) -> DataType:
    """Maps a polars dtype to the DataType enum."""
    if dtype.is_integer():
        return DataType.Integer

    if dtype.is_float():
        return DataType.Float

    base = dtype.base_type()

    if base == pl.Decimal:
        return DataType.Decimal

    if base == pl.String:
        return DataType.String

    if base == pl.Boolean:
        return DataType.Boolean

    if base == pl.Date:
        return DataType.Date

    if base == pl.Datetime:
        return DataType.DateTime

    if base == pl.Time:
        return DataType.Time

    if base == pl.Duration:
        return DataType.Duration

    if base == pl.Binary:
        return DataType.Binary

    if base in (pl.Categorical, pl.Enum):
        return DataType.Categorical

    if base in (pl.List, pl.Array):
        return DataType.List

    if base == pl.Struct:
        return DataType.Struct

    if base == pl.Null:
        return DataType.Null

    return DataType.Unknown
