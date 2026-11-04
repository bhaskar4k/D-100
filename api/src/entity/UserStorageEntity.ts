import { RowDataPacket } from "mysql2";


// Rows coming back from T_USER_STORAGE joined with T_STORAGE_MASTER by matching allowed_storage
// to the master's storage bytes. BIGINT columns are cast to CHAR in the SELECT so mysql2 hands
// them to us as strings — raw BIGINT values can exceed Number.MAX_SAFE_INTEGER (the UNLIMITED
// plan is 9223372036854775807), which would silently lose precision as JS numbers.
export interface UserStorageRow extends RowDataPacket {
    allowed_storage: string;
    used_storage: string;
    plan_name: string | null;
    plan_enum: string | null;
}


// Shape returned to the client. Byte values stay as strings so the frontend can keep full
// BIGINT precision via BigInt before formatting with its own best-fit unit picker.
export interface UserStorageDetailsResponse {
    allowedStorage: string;
    usedStorage: string;
    availableStorage: string;
    planName: string | null;
    planEnum: string | null;
}
