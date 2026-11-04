import { ResultSetHeader } from "mysql2";
import { ConnectionPool } from "../database";
import { StorageMaster, STORAGE_MASTER_BYTES } from "../../enum/StorageMasterEnum";


function ResolveAdminStoragePlan(): StorageMaster {
    const raw = (process.env.DEFAULT_ADMIN_STORAGE_PLAN || StorageMaster.UNLIMITED)
        .toString()
        .trim()
        .toUpperCase();

    const members = Object.values(StorageMaster) as string[];
    if (members.includes(raw)) {
        return raw as StorageMaster;
    }

    console.log(
        `⚠️  DEFAULT_ADMIN_STORAGE_PLAN='${raw}' is not a valid StorageMaster value; falling back to ${StorageMaster.UNLIMITED}.`
    );
    return StorageMaster.UNLIMITED;
}


export async function SeedDefaultUserIntoTUserMaster(): Promise<void> {
    const pool = await ConnectionPool;

    const name = process.env.DEFAULT_ADMIN_NAME || "Admin";
    const email = process.env.DEFAULT_ADMIN_EMAIL || "admin@datarescue.local";
    const phone = process.env.DEFAULT_ADMIN_PHONE || "0000000000";
    const password = process.env.DEFAULT_ADMIN_PASSWORD;

    if (!password || password.length < 4) {
        throw new Error(
            "DEFAULT_ADMIN_PASSWORD must be configured with at least 4 characters."
        );
    }

    const plan = ResolveAdminStoragePlan();
    const allowedStorage = STORAGE_MASTER_BYTES[plan];

    const [existingUsers] = await pool.execute(
        `SELECT ID FROM T_USER_MASTER WHERE EMAIL = ? LIMIT 1`,
        [email]
    );

    let userId: number;

    if ((existingUsers as { ID: number }[]).length > 0) {
        userId = (existingUsers as { ID: number }[])[0].ID;
        console.log("ℹ️ Default Admin User Already Exists. Skipping Seed.");
    } else {
        const hashedPassword = password;

        const [result] = await pool.execute<ResultSetHeader>(
            `INSERT INTO T_USER_MASTER
                (created_at, active, deleted, email, name, password, phone)
             VALUES (CURRENT_TIMESTAMP, 1, 0, ?, ?, ?, ?)`,
            [email, name, hashedPassword, phone]
        );

        userId = result.insertId;
        console.log("✅ Default Admin User Seeded Successfully.");
    }

    // Ensure the admin has a quota row. Idempotent: do nothing if one already exists (so the
    // plan env var doesn't retroactively overwrite a quota an operator may have adjusted).
    const [existingStorage] = await pool.execute(
        `SELECT ID FROM T_USER_STORAGE WHERE USER_ID = ? LIMIT 1`,
        [userId]
    );

    if ((existingStorage as { ID: number }[]).length > 0) {
        console.log("ℹ️ Default Admin User Storage Row Already Exists. Skipping Seed.");
        return;
    }

    await pool.execute(
        `INSERT INTO T_USER_STORAGE (USER_ID, ALLOWED_STORAGE, USED_STORAGE)
         VALUES (?, ?, 0)`,
        [userId, allowedStorage]
    );

    console.log(`✅ Default Admin User Storage Seeded (${plan}).`);
}
