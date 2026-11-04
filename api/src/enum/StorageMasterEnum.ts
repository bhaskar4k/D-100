// String enum stored in T_STORAGE_MASTER.enum. Values are the contract with any consumer
// that reads storage plans; never rename, only add.
export enum StorageMaster {
    BRONZE = "BRONZE",
    SILVER = "SILVER",
    IRON = "IRON",
    GOLD = "GOLD",
    DIAMOND = "DIAMOND",
    UNLIMITED = "UNLIMITED",
}

// 1 GiB expressed in bytes. Storage quotas are stored as raw byte counts so the DB never has
// to know about display units.
export const BYTES_PER_GIB = 1024 ** 3;
export const MAX_BIGINT_SIGNED = "9223372036854775807";

// Byte allowance per plan. Single source of truth for the seeder and any runtime lookup
// (e.g. upgrading a user's quota). `satisfies` keeps the keys exhaustive — adding a new
// StorageMaster member fails here until a size is defined for it.
export const STORAGE_MASTER_BYTES = {
    [StorageMaster.BRONZE]: 5 * BYTES_PER_GIB,
    [StorageMaster.SILVER]: 10 * BYTES_PER_GIB,
    [StorageMaster.IRON]: 20 * BYTES_PER_GIB,
    [StorageMaster.GOLD]: 50 * BYTES_PER_GIB,
    [StorageMaster.DIAMOND]: 100 * BYTES_PER_GIB,
    [StorageMaster.UNLIMITED]: MAX_BIGINT_SIGNED,
} satisfies Record<StorageMaster, number | string>;
