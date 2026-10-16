import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ConnectionPool } from "../database";

export async function ExecuteTUserMasterScript(): Promise<void> {
    const sqlFilePath = resolve(
        process.cwd(),
        "src/data-access-layer/scripts/T_USER_MASTER.sql"
    );

    const sql = await readFile(sqlFilePath, "utf-8");
    const pool = await ConnectionPool;

    await pool.query(sql);

    console.log("✅ T_USER_MASTER Table Initialized Successfully.");
}