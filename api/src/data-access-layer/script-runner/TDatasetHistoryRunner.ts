import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ConnectionPool } from "../database";

export async function ExecuteTDatasetHistoryScript(): Promise<void> {
    const sqlFilePath = resolve(
        process.cwd(),
        "src/data-access-layer/scripts/T_DATASET_HISTORY.sql"
    );

    const sql = await readFile(sqlFilePath, "utf-8");
    const pool = await ConnectionPool;

    await pool.query(sql);

    console.log("✅ T_DATASET_HISTORY Table Initialized Successfully.");
}
