import mysql, { Pool } from "mysql2/promise";
import "dotenv/config";

const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
};

const database = process.env.DB_NAME || "D_100";


export async function InitializeDatabase(): Promise<Pool> {
    const connection = await mysql.createConnection(config);

    try {
        const escapedDatabase = database.replace(/`/g, "``");

        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${escapedDatabase}\``
        );
    } finally {
        await connection.end();
    }

    return mysql.createPool({
        ...config,
        database,
        waitForConnections: true,
        connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
        queueLimit: 0
    });
}


export const ConnectionPool = InitializeDatabase();