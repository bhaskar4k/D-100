import { RowDataPacket } from "mysql2";

export interface UserExistsRow extends RowDataPacket {
    id: string | number;
}

export interface UserLoginRow extends RowDataPacket {
    id: string | number;
    password: string;
    active: number;
    deleted: number;
}