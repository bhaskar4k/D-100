// Byte values come as strings so BIGINT quotas (up to the UNLIMITED plan's 2^63-1) survive the
// trip without losing precision in JS. The UI parses them with BigInt before formatting.
export interface UserStorageDetails {
    allowedStorage: string;
    usedStorage: string;
    availableStorage: string;
    planName: string | null;
    planEnum: string | null;
}
