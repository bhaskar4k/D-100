import "dotenv/config";
import app from "./app";
import { ConnectionPool } from "./data-access-layer/database";
import { CreateTables } from "./data-access-layer/script-runner/CreateTables";
import { SeedTables } from "./data-access-layer/data-seeder/SeedTables";
import { RedisConnection } from "./config/RedisConfig";
import { InitializeStorage } from "./config/StorageConfig";
import { Logger } from "./log/Logger";
import { WorkerJobManager } from "./worker-job/WorkerJobManager";
import { RegisterWorkerJobs } from "./worker-job/WorkerJobRegistry";


const PORT = Number(process.env.PORT) || 3000;
const API_SERVER_URL = process.env.API_SERVER_URL || "http://localhost";


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

        // Register Worker Jobs
        RegisterWorkerJobs();

        // Start Worker Jobs
        await WorkerJobManager.StartAll();


        app.listen(PORT, () => {
            console.log(`✅ API Server Running At ${API_SERVER_URL}:${PORT}`);
            void Logger.Info(`API Server started on port ${PORT}.`);
        });
    } catch (error) {
        console.error("❌ Failed to initialize MySQL:", error);
        process.exit(1);
    }
}

StartServer();