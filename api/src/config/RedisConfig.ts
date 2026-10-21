import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const RedisClient = createClient({ url: REDIS_URL });

RedisClient.on("error", (error) => {
    console.error("Redis Error:", error);
});

export const RedisConnection: Promise<typeof RedisClient> = RedisClient.connect().then(() => {
    console.log("✅ Redis connected");
    return RedisClient;
});

export default RedisClient;
