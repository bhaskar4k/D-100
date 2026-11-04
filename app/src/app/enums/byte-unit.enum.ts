// Base-1024 units for formatting byte counts. Values are the display labels, so an iterator
// over the enum gives both the label and the key to look up its divisor. Kept as a string
// enum (not a numeric one) so consumers never confuse the ordinal with the divisor.
export enum ByteUnit {
    PB = "PB",
    TB = "TB",
    GB = "GB",
    MB = "MB",
    KB = "KB",
    BYTE = "Byte",
}


// Divisor in bytes for each unit. `satisfies` keeps the keys exhaustive — adding a new
// ByteUnit member fails here until a divisor is defined for it. bigint is required because
// PB (1024^5 = 2^50) still fits in a JS number but future-proofs any additions beyond that.
export const BYTE_UNIT_DIVISORS = {
    [ByteUnit.PB]: 1024n ** 5n,
    [ByteUnit.TB]: 1024n ** 4n,
    [ByteUnit.GB]: 1024n ** 3n,
    [ByteUnit.MB]: 1024n ** 2n,
    [ByteUnit.KB]: 1024n,
    [ByteUnit.BYTE]: 1n,
} satisfies Record<ByteUnit, bigint>;


// Descending iteration order for "best fit" formatting: start at PB and walk down until the
// value is at least as large as the current unit's divisor. Pulled into its own export so
// callers never rely on `Object.values(ByteUnit)` ordering, which, while stable in practice,
// is not something to lean on.
export const BYTE_UNITS_DESC: ReadonlyArray<ByteUnit> = [
    ByteUnit.PB,
    ByteUnit.TB,
    ByteUnit.GB,
    ByteUnit.MB,
    ByteUnit.KB,
    ByteUnit.BYTE,
];
