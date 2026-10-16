import "dotenv/config";
import app from "./app";
import { ConnectionPool } from "./data-access-layer/database";
import { CreateTables } from "./data-access-layer/script-runner/CreateTables";

const PORT = Number(process.env.PORT) || 3000;

async function StartServer(): Promise<void> {
    try {
        await ConnectionPool;
        await CreateTables();

        app.listen(PORT, () => {
            console.log(`✅ Server Running At http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to initialize MySQL:", error);
        process.exit(1);
    }
}

StartServer();