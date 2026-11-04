// Mirrors api/src/enum/StorageMasterEnum.ts. Values are the contract with the backend
// (T_STORAGE_MASTER.enum column) — never rename, only add. When the backend returns a
// user's allocation that doesn't match any seeded plan, `planEnum` comes back null and the
// UI falls back to CUSTOM for labeling/styling.
export enum StorageMaster {
    BRONZE = "BRONZE",
    SILVER = "SILVER",
    IRON = "IRON",
    GOLD = "GOLD",
    DIAMOND = "DIAMOND",
    UNLIMITED = "UNLIMITED",
    CUSTOM = "CUSTOM",
}


// Display label + CSS class per plan. The class names live in the global stylesheet as
// `.app-badge.plan-*` so any component can render the badge with `app-badge plan-badge <color>`.
// `satisfies` keeps the keys exhaustive — adding a new StorageMaster member fails here until
// its label / color are defined.
export const STORAGE_MASTER_LABEL = {
    [StorageMaster.BRONZE]: { label: 'Bronze', color: 'plan-bronze' },
    [StorageMaster.SILVER]: { label: 'Silver', color: 'plan-silver' },
    [StorageMaster.IRON]: { label: 'Iron', color: 'plan-iron' },
    [StorageMaster.GOLD]: { label: 'Gold', color: 'plan-gold' },
    [StorageMaster.DIAMOND]: { label: 'Diamond', color: 'plan-diamond' },
    [StorageMaster.UNLIMITED]: { label: 'Unlimited', color: 'plan-unlimited' },
    [StorageMaster.CUSTOM]: { label: 'Custom', color: 'plan-custom' },
} satisfies Record<StorageMaster, { label: string; color: string }>;


// Resolves an enum string (from the backend) to the known plan, defaulting to CUSTOM for
// anything missing or unrecognized. Centralized here so callers don't repeat the switch.
export function ResolveStorageMaster(planEnum: string | null | undefined): StorageMaster {
    if (!planEnum) {
        return StorageMaster.CUSTOM;
    }
    const upper = planEnum.toUpperCase();
    const known = Object.values(StorageMaster) as string[];
    return known.includes(upper) ? (upper as StorageMaster) : StorageMaster.CUSTOM;
}
