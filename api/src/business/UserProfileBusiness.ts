import { ConnectionPool } from "../data-access-layer/database";
import { UserProfileRow, UserProfileDetailsResponse } from "../entity/UserProfileEntity";
import { Status, TrueFalse } from "../enum/CommonEnum";


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
}
