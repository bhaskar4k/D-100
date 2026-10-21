import { RowDataPacket } from "mysql2";
import { UserStatus } from "../enum/UserEnum";

export interface UserExistsRow extends RowDataPacket {
    id: string | number;
}

export interface LoginResult {
    status: UserStatus;
    token?: string;
}

export interface UserLoginRow extends RowDataPacket {
    id: string | number;
    password: string;
    active: number;
    deleted: number;
}