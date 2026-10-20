import { ResultSetHeader, RowDataPacket } from "mysql2";
import { ConnectionPool } from "../data-access-layer/database";


export class UserBusiness {
    static async DoGetMenu(): Promise<string> {
        const pool = await ConnectionPool;

        return "Done";
    }
}