import { ResultSetHeader } from "mysql2";
import { ConnectionPool } from "../data-access-layer/database";
import jwt from "jsonwebtoken";
import { v7 as uuidv7 } from "uuid";
import { RedisConnection } from "../config/RedisConfig";
import { JwtSecret, JwtExpiresInSeconds } from "../config/JwtConfig";
import { LoginResult, UserExistsRow, UserLoginRow } from "../entity/AuthenticationEntity";
import { UserStatus } from "../enum/UserEnum";
import { Status, TrueFalse } from "../enum/CommonEnum";
import { StorageMaster, STORAGE_MASTER_BYTES } from "../enum/StorageMasterEnum";
import { GetSessionKey } from "../util/AuthUtil";
import { Logger } from "../log/Logger";

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
        const pool = await ConnectionPool;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const hashedPassword = password;

            const [userResult] = await connection.execute<ResultSetHeader>(
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

            if (userResult.affectedRows !== 1) {
                await connection.rollback();
                return false;
            }

            // Every new sign-up starts on the BRONZE plan. Wrapped in the same transaction as
            // the user insert so a failure here can't leave a user without a quota row.
            await connection.execute(
                `INSERT INTO T_USER_STORAGE (USER_ID, ALLOWED_STORAGE, USED_STORAGE)
                 VALUES (?, ?, 0)`,
                [userResult.insertId, STORAGE_MASTER_BYTES[StorageMaster.BRONZE]]
            );

            await connection.commit();

            await Logger.Info(`User registered: ${email}`, userResult.insertId);
            return true;
        } catch (error: any) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
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
                await Logger.Info(`Login failed: no user found for ${email}.`);
                return { status: UserStatus.DoesNotExist };
            }

            const user = rows[0];

            if (user.active === Status.Inactive) {
                await Logger.Info(`Login failed: user is inactive (${email}).`, user.id);
                return { status: UserStatus.Inactive };
            }

            if (user.deleted === TrueFalse.True) {
                await Logger.Info(`Login failed: user is deleted (${email}).`, user.id);
                return { status: UserStatus.Deleted };
            }

            if (user.password !== password) {
                await Logger.Info(`Login failed: invalid password (${email}).`, user.id);
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

            await Logger.Info(`User logged in: ${email}`, user.id);

            return { status: UserStatus.Active, token: UUID };
        } catch (error: any) {
            throw error;
        }
    }
}