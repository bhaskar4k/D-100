import { RowDataPacket } from "mysql2";


// Row shape coming back from T_USER_MASTER. `id` is cast to string so BIGINT precision
// survives the trip through JS — the user's id can grow past Number.MAX_SAFE_INTEGER on a
// large deployment, and the frontend treats it as an opaque string anyway.
export interface UserProfileRow extends RowDataPacket {
    id: string;
    name: string;
    email: string;
    phone: string;
    active: number;
    deleted: number;
    created_at: string | Date;
    modified_at: string | Date | null;
}


// Shape returned to the client. ISO strings on the wire so Angular's date pipe can format
// them with the shared DateFormat constant.
export interface UserProfileDetailsResponse {
    id: string;
    name: string;
    email: string;
    phone: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    modifiedAt: string | null;
}
