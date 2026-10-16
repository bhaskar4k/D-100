import "dotenv/config";
import app from "./app";
import { ConnectionPool } from "./data-access-layer/database";
import { ExecuteTMenuMasterScript } from "./data-access-layer/script-runner/TMenuMasterRunner";

const PORT = Number(process.env.PORT) || 3000;

async function StartServer(): Promise<void> {
    try {
        await ConnectionPool;
        await ExecuteTMenuMasterScript();
        
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
            console.log("MySQL connected successfully");
        });
    } catch (error) {
        console.error("Failed to initialize MySQL:", error);
        process.exit(1);
    }
}

StartServer();