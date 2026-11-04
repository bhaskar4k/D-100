import { ConnectionPool } from "../../data-access-layer/database";
import { StorageMaster } from "../../enum/StorageMasterEnum";

// 1 GiB expressed in bytes. Storage quotas are stored as raw byte counts so the DB never has
// to know about display units; the plan sizes below multiply up from here.
const BYTES_PER_GIB = 1024 ** 3;


interface StorageMasterSeed {
    name: string;
    enum: StorageMaster;
    storage: number;
    is_active: number;
}


const plans: StorageMasterSeed[] = [
    { name: "Bronze Plan",  enum: StorageMaster.BRONZE,  storage: 5   * BYTES_PER_GIB, is_active: 1 },
    { name: "Silver Plan",  enum: StorageMaster.SILVER,  storage: 10  * BYTES_PER_GIB, is_active: 1 },
    { name: "Iron Plan",    enum: StorageMaster.IRON,    storage: 20  * BYTES_PER_GIB, is_active: 1 },
    { name: "Gold Plan",    enum: StorageMaster.GOLD,    storage: 50  * BYTES_PER_GIB, is_active: 1 },
    { name: "Diamond Plan", enum: StorageMaster.DIAMOND, storage: 100 * BYTES_PER_GIB, is_active: 1 },
];


export async function SeedTStorageMaster(): Promise<void> {
    const pool = await ConnectionPool;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        for (const item of plans) {
            // `enum` is a MySQL reserved word, so it needs to be backticked in every query.
            const [existing] = await connection.execute<any[]>(
                `SELECT ID
                 FROM T_STORAGE_MASTER
                 WHERE \`enum\` = ?
                 LIMIT 1`,
                [item.enum]
            );

            if (existing.length > 0) {
                await connection.execute(
                    `UPDATE T_STORAGE_MASTER
                     SET NAME = ?,
                         STORAGE = ?,
                         IS_ACTIVE = ?
                     WHERE ID = ?`,
                    [item.name, item.storage, item.is_active, existing[0].ID]
                );
            } else {
                await connection.execute(
                    `INSERT INTO T_STORAGE_MASTER
                        (NAME, \`enum\`, STORAGE, IS_ACTIVE)
                     VALUES (?, ?, ?, ?)`,
                    [item.name, item.enum, item.storage, item.is_active]
                );
            }
        }

        await connection.commit();

        console.log("✅ T_STORAGE_MASTER Seeded Successfully.");
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
