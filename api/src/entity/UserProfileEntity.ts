import { RowDataPacket } from "mysql2";


// Row shape coming back from T_USER_MASTER. The user id is identified by the JWT on every
// request, so the profile payload doesn't carry it — nothing on the client needs it.
export interface UserProfileRow extends RowDataPacket {
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
    name: string;
    email: string;
    phone: string;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: string;
    modifiedAt: string | null;
}
