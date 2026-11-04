import { ConnectionPool } from "../data-access-layer/database";
import { UserStorageRow, UserStorageDetailsResponse } from "../entity/UserStorageEntity";


export class UserStorageBusiness {
    // Returns the caller's allocated / used / available quota in bytes along with the plan
    // their current allowance maps to. `allowed_storage` is matched against T_STORAGE_MASTER.storage
    // so an operator who tweaks an individual user's quota outside any plan still gets a sane
    // response (plan comes back null and the UI shows "Custom"). BIGINT columns are cast to CHAR
    // inside the SELECT so values beyond Number.MAX_SAFE_INTEGER survive the trip through JS,
    // and the subtraction for `available` is done with BigInt for the same reason.
    static async DoGetUserStorageDetails(UserId: number): Promise<UserStorageDetailsResponse | null> {
        const pool = await ConnectionPool;

        const [rows] = await pool.query<UserStorageRow[]>(
            `SELECT CAST(us.allowed_storage AS CHAR) AS allowed_storage,
                    CAST(us.used_storage AS CHAR) AS used_storage,
                    sm.name AS plan_name,
                    sm.\`enum\` AS plan_enum
             FROM T_USER_STORAGE us
             LEFT JOIN T_STORAGE_MASTER sm
                 ON sm.storage = us.allowed_storage
                 AND sm.is_active = 1
             WHERE us.user_id = ?
             LIMIT 1`,
            [UserId]
        );

        if (rows.length === 0) {
            return null;
        }

        const row = rows[0];
        const allowed = BigInt(row.allowed_storage);
        const used = BigInt(row.used_storage);
        // Clamp to 0 so a stray over-write on used_storage never surfaces as a negative number
        // in the UI — that case means the row is wrong, not that the user has negative space.
        const available = used > allowed ? 0n : allowed - used;

        return {
            allowedStorage: allowed.toString(),
            usedStorage: used.toString(),
            availableStorage: available.toString(),
            planName: row.plan_name,
            planEnum: row.plan_enum,
        };
    }
}
