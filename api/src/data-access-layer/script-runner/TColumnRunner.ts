import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ConnectionPool } from "../database";

export async function ExecuteTColumnScript(): Promise<void> {
    const sqlFilePath = resolve(
        process.cwd(),
        "src/data-access-layer/scripts/T_COLUMN.sql"
    );

    const sql = await readFile(sqlFilePath, "utf-8");
    const pool = await ConnectionPool;

    await pool.query(sql);

    console.log("✅ T_COLUMN Table Initialized Successfully.");
}
