import { ConnectionPool } from "../database";

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

    const [existingUsers] = await pool.execute(
        `SELECT ID FROM T_USER_MASTER WHERE EMAIL = ? LIMIT 1`,
        [email]
    );

    if ((existingUsers as { ID: number }[]).length > 0) {
        console.log("ℹ️ Default Admin User Already Exists. Skipping Seed.");
        return;
    }

    const hashedPassword = password;

    await pool.execute(
        `INSERT INTO T_USER_MASTER
            (created_at, active, deleted, email, name, password, phone)
         VALUES (CURRENT_TIMESTAMP, 1, 0, ?, ?, ?, ?)`,
        [email, name, hashedPassword, phone]
    );

    console.log("✅ Default Admin User Seeded Successfully.");
}