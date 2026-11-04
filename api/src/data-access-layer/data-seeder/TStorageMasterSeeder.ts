import { ConnectionPool } from "../../data-access-layer/database";
import { StorageMaster, STORAGE_MASTER_BYTES } from "../../enum/StorageMasterEnum";


// STORAGE_MASTER_BYTES already yields a DB-safe value per plan — finite plans hold a plain
// number of bytes and the UNLIMITED plan holds the max signed BIGINT as a string (mysql2
// accepts strings for BIGINT without precision loss). The seeder passes it straight through.
interface StorageMasterSeed {
    name: string;
    enum: StorageMaster;
    storage: number | string;
    is_active: number;
}


// Byte counts come straight from STORAGE_MASTER_BYTES, so adding a new plan is a one-line
// change in the enum file plus a name entry here.
const plans: StorageMasterSeed[] = [
    { name: "Bronze Plan", enum: StorageMaster.BRONZE, storage: STORAGE_MASTER_BYTES[StorageMaster.BRONZE], is_active: 1 },
    { name: "Silver Plan", enum: StorageMaster.SILVER, storage: STORAGE_MASTER_BYTES[StorageMaster.SILVER], is_active: 1 },
    { name: "Iron Plan", enum: StorageMaster.IRON, storage: STORAGE_MASTER_BYTES[StorageMaster.IRON], is_active: 1 },
    { name: "Gold Plan", enum: StorageMaster.GOLD, storage: STORAGE_MASTER_BYTES[StorageMaster.GOLD], is_active: 1 },
    { name: "Diamond Plan", enum: StorageMaster.DIAMOND, storage: STORAGE_MASTER_BYTES[StorageMaster.DIAMOND], is_active: 1 },
    { name: "Unlimited Plan", enum: StorageMaster.UNLIMITED, storage: STORAGE_MASTER_BYTES[StorageMaster.UNLIMITED], is_active: 1 },
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
