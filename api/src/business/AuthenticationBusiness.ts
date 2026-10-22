import { ResultSetHeader } from "mysql2";
import { ConnectionPool } from "../data-access-layer/database";
import jwt from "jsonwebtoken";
import { v7 as uuidv7 } from "uuid";
import { RedisConnection } from "../config/RedisConfig";
import { JwtSecret, JwtExpiresInSeconds } from "../config/JwtConfig";
import { LoginResult, UserExistsRow, UserLoginRow } from "../entity/AuthenticationEntity";
import { UserStatus } from "../enum/UserEnum";
import { Status, TrueFalse } from "../enum/CommonEnum";
import { GetSessionKey } from "../util/AuthUtil";

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


    static async DoLogin(email: string, password: string): Promise<LoginResult> {
        try {
            const pool = await ConnectionPool;
            email = email.trim().toLowerCase();

            const [rows] = await pool.execute<UserLoginRow[]>(
                `SELECT id, password, active, deleted
                 FROM T_USER_MASTER
                 WHERE email = ?
                 LIMIT 1`,
                [email]
            );

            if (rows.length === 0) {
                return { status: UserStatus.DoesNotExist };
            }

            const user = rows[0];

            if (user.active === Status.Inactive) {
                return { status: UserStatus.Inactive };
            }

            if (user.deleted === TrueFalse.True) {
                return { status: UserStatus.Deleted };
            }

            if (user.password !== password) {
                return { status: UserStatus.PasswordMismatch };
            }

            const UUID = uuidv7();
            const SessionId = GetSessionKey(UUID);

            const JwtToken = jwt.sign(
                { id: user.id },
                JwtSecret,
                { expiresIn: JwtExpiresInSeconds }
            );

            const redis = await RedisConnection;
            await redis.set(SessionId, JwtToken, { EX: JwtExpiresInSeconds });

            return { status: UserStatus.Active, token: UUID };
        } catch (error: any) {
            throw error;
        }
    }
}