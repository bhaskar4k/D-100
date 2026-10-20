import { ResultSetHeader } from "mysql2";
import { ConnectionPool } from "../data-access-layer/database";
import { UserExistsRow, UserLoginRow } from "../entity/AuthenticationEntity";
import { UserStatus } from "../enum/UserEnum";
import { Status, TrueFalse } from "../enum/CommonEnum";

export class AuthenticationBusiness {
    static async IsEmailRegistered(email: string): Promise<boolean> {
        try {
            const pool = await ConnectionPool;

            const [rows] = await pool.execute<UserExistsRow[]>(
                `SELECT id
             FROM T_USER_MASTER
             WHERE email = ?
             LIMIT 1`,
                [email.trim().toLowerCase()]
            );

            return rows.length > 0;
        } catch (error: any) {
            throw error;
        }
    }


    static async IsPhoneRegistered(phone: string): Promise<boolean> {
        try {
            const pool = await ConnectionPool;

            const [rows] = await pool.execute<UserExistsRow[]>(
                `SELECT id
             FROM T_USER_MASTER
             WHERE phone = ?
             LIMIT 1`,
                [phone.trim()]
            );

            return rows.length > 0;
        } catch (error: any) {
            throw error;
        }
    }


    static async DoRegister(name: string, email: string, phone: string, password: string): Promise<boolean> {
        try {
            const pool = await ConnectionPool;

            const hashedPassword = password;

            const [result] = await pool.execute<ResultSetHeader>(
                `INSERT INTO T_USER_MASTER
                    (name, email, phone, password)
                 VALUES (?, ?, ?, ?)`,
                [
                    name,
                    email,
                    phone,
                    hashedPassword
                ]
            );

            return result.affectedRows === 1;
        } catch (error: any) {
            throw error;
        }
    }


    static async DoLogin(email: string, password: string): Promise<UserStatus> {
        try {
            const pool = await ConnectionPool;

            const [rows] = await pool.execute<UserLoginRow[]>(
                `SELECT id, password, active, deleted
                 FROM T_USER_MASTER
                 WHERE email = ?
                 LIMIT 1`,
                [email.trim().toLowerCase()]
            );

            if (rows.length === 0) {
                return UserStatus.DoesNotExist;
            }

            const user = rows[0];

            console.log("User:", user);

            if (user.active === Status.Inactive) {
                return UserStatus.Inactive;
            }

            if (user.deleted === TrueFalse.True) {
                return UserStatus.Deleted;
            }

            if (user.password !== password) {
                return UserStatus.PasswordMismatch;
            }

            return UserStatus.Active;
        } catch (error: any) {
            throw error;
        }
    }
}