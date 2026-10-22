import { createClient } from "redis";
import "dotenv/config";
import { ConnectionPool } from "../data-access-layer/database";

const url = process.env.REDIS_URL || "redis://localhost:6379";


export async function InitializeRedis() {
    console.log("=====================================================");
    console.log(" Started :: Connect Redis\n");
    console.log("⌛ Attempting To Connect Redis.");

    const client = createClient({ url });

    client.on("error", (error) => {
        console.error("Redis Error:", error);
    });

    try {
        await client.connect();

        console.log("✅ Redis Connected Successfully.");
    } finally {
        console.log("\n Finished :: Connect Redis");
        console.log("=====================================================\n");
    }

    return client;
}


export const RedisConnection = ConnectionPool.then(() => InitializeRedis());
