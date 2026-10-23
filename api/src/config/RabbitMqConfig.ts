import amqplib, { ChannelModel, Channel } from "amqplib";
import "dotenv/config";
import { RedisConnection } from "./RedisConfig";

// Single app-wide RabbitMQ connection + channel. Publishers and consumers both reuse these:
// opening a connection per message is slow and leaks file descriptors.

const Host = process.env.RABBITMQ_HOST || "localhost";
const Port = Number(process.env.RABBITMQ_PORT) || 5672;
const User = process.env.RABBITMQ_USER || "d100admin";
const Password = process.env.RABBITMQ_PASSWORD || "d100_dev_password";
const VHost = process.env.RABBITMQ_VHOST || "/";

const Url = `amqp://${encodeURIComponent(User)}:${encodeURIComponent(Password)}@${Host}:${Port}/${encodeURIComponent(VHost === "/" ? "" : VHost)}`;

let Connection: ChannelModel | null = null;
let SharedChannel: Channel | null = null;


export async function InitializeRabbitMq(): Promise<ChannelModel> {
    console.log("=====================================================");
    console.log(" Started :: Connect RabbitMQ\n");
    console.log("⌛ Attempting To Connect RabbitMQ.");

    try {
        Connection = await amqplib.connect(Url);

        Connection.on("error", (error) => {
            console.error("RabbitMQ Connection Error:", error);
        });

        Connection.on("close", () => {
            console.warn("⚠️  RabbitMQ Connection Closed.");
            Connection = null;
            SharedChannel = null;
        });

        SharedChannel = await Connection.createChannel();

        console.log("✅ RabbitMQ Connected Successfully.");
    } finally {
        console.log("\n Finished :: Connect RabbitMQ");
        console.log("=====================================================\n");
    }

    return Connection;
}


export function GetRabbitMqChannel(): Channel {
    if (SharedChannel === null) {
        throw new Error("RabbitMQ channel is not initialized. Call InitializeRabbitMq() first.");
    }

    return SharedChannel;
}


export async function CloseRabbitMq(): Promise<void> {
    try {
        if (SharedChannel !== null) {
            await SharedChannel.close();
            SharedChannel = null;
        }

        if (Connection !== null) {
            await Connection.close();
            Connection = null;
        }
    } catch (error) {
        console.error("RabbitMQ Close Error:", error);
    }
}


export const RabbitMqConnection = RedisConnection.then(() => InitializeRabbitMq());
