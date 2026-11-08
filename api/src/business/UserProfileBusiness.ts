import { ResultSetHeader, RowDataPacket } from "mysql2";
import { ConnectionPool } from "../data-access-layer/database";
import { UserProfileRow, UserProfileDetailsResponse } from "../entity/UserProfileEntity";
import { Status, TrueFalse } from "../enum/CommonEnum";


interface PasswordRow extends RowDataPacket {
    password: string;
    active: number;
    deleted: number;
}


// Minimum length mirrors the register form's Validators.minLength(8). Kept here so the
// business layer refuses weak passwords even if a caller bypasses the UI.
const MinPasswordLength = 8;
const MaxPasswordLength = 255;


function ToIsoString(value: string | Date | null): string | null {
    if (value === null || value === undefined) return null;
    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString();
}


export class UserProfileBusiness {
    // Returns the authenticated user's profile from T_USER_MASTER. The password column is
    // never selected, let alone returned. `id` is cast to CHAR in the SELECT so BIGINT
    // precision survives through mysql2.
    static async DoGetUserProfile(UserId: number): Promise<UserProfileDetailsResponse | null> {
        const pool = await ConnectionPool;

        const [rows] = await pool.query<UserProfileRow[]>(
            `SELECT CAST(id AS CHAR) AS id,
                    name,
                    email,
                    phone,
                    active,
                    deleted,
                    created_at,
                    modified_at
             FROM T_USER_MASTER
             WHERE id = ?
             LIMIT 1`,
            [UserId]
        );

        if (rows.length === 0) {
            return null;
        }

        const row = rows[0];

        return {
            id: row.id,
            name: row.name,
            email: row.email,
            phone: row.phone,
            isActive: row.active === Status.Active,
            isDeleted: row.deleted === TrueFalse.True,
            createdAt: ToIsoString(row.created_at) ?? "",
            modifiedAt: ToIsoString(row.modified_at),
        };
    }


    // Changes the signed-in user's password after verifying the current one. Returns an error
    // string that the controller forwards as a 400-style response, or null on success.
    // Passwords are stored in T_USER_MASTER as-is (see AuthenticationBusiness.DoLogin, which
    // compares with `===`) — we match that convention here rather than quietly introducing a
    // one-sided hash.
    static async DoChangePassword(
        UserId: number,
        CurrentPassword: string,
        NewPassword: string
    ): Promise<string | null> {
        if (!CurrentPassword) {
            return "Current password is required.";
        }
        if (!NewPassword) {
            return "New password is required.";
        }
        if (NewPassword.length < MinPasswordLength) {
            return `New password must be at least ${MinPasswordLength} characters.`;
        }
        if (NewPassword.length > MaxPasswordLength) {
            return `New password must be ${MaxPasswordLength} characters or fewer.`;
        }
        if (NewPassword === CurrentPassword) {
            return "New password must be different from the current password.";
        }

        const pool = await ConnectionPool;

        const [rows] = await pool.query<PasswordRow[]>(
            `SELECT password, active, deleted
             FROM T_USER_MASTER
             WHERE id = ?
             LIMIT 1`,
            [UserId]
        );

        if (rows.length === 0) {
            return "User not found.";
        }

        const user = rows[0];

        // Defensive: the JWT guard should already have blocked deleted/inactive users from
        // reaching this call, but the DB is the source of truth so we check again.
        if (user.deleted === TrueFalse.True) {
            return "Account is deleted.";
        }
        if (user.active !== Status.Active) {
            return "Account is inactive.";
        }

        if (user.password !== CurrentPassword) {
            return "Current password is incorrect.";
        }

        const [result] = await pool.execute<ResultSetHeader>(
            `UPDATE T_USER_MASTER
             SET password = ?
             WHERE id = ?`,
            [NewPassword, UserId]
        );

        if (result.affectedRows !== 1) {
            return "Could not update the password. Please try again.";
        }

        return null;
    }
}
