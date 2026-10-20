import { RowDataPacket } from "mysql2";

export interface UserExistsRow extends RowDataPacket {
    id: string | number;
}