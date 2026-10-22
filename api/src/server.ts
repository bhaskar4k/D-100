import "dotenv/config";
import app from "./app";
import { ConnectionPool } from "./data-access-layer/database";
import { CreateTables } from "./data-access-layer/script-runner/CreateTables";
import { SeedTables } from "./data-access-layer/data-seeder/SeedTables";
import { RedisConnection } from "./config/RedisConfig";
import { InitializeStorage } from "./config/StorageConfig";
import { Logger } from "./log/Logger";


const PORT = Number(process.env.PORT) || 3000;


async function StartServer(): Promise<void> {
    try {
        // Connect DB
        await ConnectionPool;

        // Connect Redis
        await RedisConnection;

        // Create Storage Folders
        await InitializeStorage();

        // Create Tables
        await CreateTables();

        // Seed Tables
        await SeedTables();
        
        
        app.listen(PORT, () => {
            console.log(`✅ Server Running At http://localhost:${PORT}`);
            void Logger.Info(`Server started on port ${PORT}.`);
        });
    } catch (error) {
        console.error("❌ Failed to initialize MySQL:", error);
        process.exit(1);
    }
}

StartServer();