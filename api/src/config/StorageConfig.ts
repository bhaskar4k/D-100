import fs from "fs/promises";
import path from "path";
import "dotenv/config";

const Folders = [
    { name: "RAW", env: "RAW_UPLOAD_PATH" },
    { name: "INGEST", env: "INGEST_UPLOAD_PATH" },
    { name: "DOWNLOAD", env: "DOWNLOAD_TEMP_PATH" }
];


export async function InitializeStorage(): Promise<void> {
    console.log("=====================================================");
    console.log(" Started :: Create Storage Folders\n");

    try {
        for (const folder of Folders) {
            const value = process.env[folder.env];

            if (!value) {
                throw new Error(`${folder.env} is not configured in .env`);
            }

            const folderPath = path.resolve(value);
            const existed = await fs.stat(folderPath).then((stat) => stat.isDirectory(), () => false);

            await fs.mkdir(folderPath, { recursive: true });

            console.log(existed
                ? `ℹ️ ${folder.name} Folder Already Exists. Skipping.`
                : `✅ ${folder.name} Folder Created Successfully.`);
        }
    } finally {
        console.log("\n Finished :: Create Storage Folders");
        console.log("=====================================================\n");
    }
}
