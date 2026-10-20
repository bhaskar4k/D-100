import { ResultSetHeader, RowDataPacket } from "mysql2";
import { ConnectionPool } from "../data-access-layer/database";
import { MenuItem, MenuRow } from "../entity/CommonEntity";

export class AuthenticationBusiness {
    static async DoRegister(name: string, email: string, phone: string, password: string): Promise<boolean> {
        console.log("DoRegister called with:", { name, email, phone, password });
        const pool = await ConnectionPool;

        return true;
    }
}