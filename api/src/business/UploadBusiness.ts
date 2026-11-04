import fs from "fs/promises";
import path from "path";
import { ResultSetHeader } from "mysql2";
import { v7 as uuidv7, validate as IsValidUuid } from "uuid";
import { RedisConnection } from "../config/RedisConfig";
import { ConnectionPool } from "../data-access-layer/database";
import { FileUploadStatus } from "../enum/FileUploadStatus";
import { GetAllowedExtensions } from "../util/UploadUtil";
import { Logger } from "../log/Logger";
import { UploadInitiateResult, UploadSession } from "../entity/UploadEntity";

const RAW_UPLOAD_PATH = process.env.RAW_UPLOAD_PATH;

if (!RAW_UPLOAD_PATH) {
    throw new Error("RAW_UPLOAD_PATH is not configured in .env");
}

export const ChunkSize = (Number(process.env.UPLOAD_CHUNK_SIZE_MB) || 8) * 1024 * 1024;

const UploadSessionTtlSeconds = Number(process.env.UPLOAD_SESSION_TTL_SECONDS) || 24 * 60 * 60;
const UploadedFileName = process.env.UPLOAD_FILE_NAME || "UploadedFile";


function SessionKey(UploadId: string): string {
    return `UPLOAD-${UploadId}`;
}

function ChunksKey(UploadId: string): string {
    return `UPLOAD-${UploadId}-CHUNKS`;
}

function GetFilePath(UploadId: string, Extension: string): string {
    return path.join(path.resolve(RAW_UPLOAD_PATH!), UploadId, `${UploadedFileName}${Extension}`);
}

async function GetSession(UploadId: string, UserId: string): Promise<UploadSession | null> {
    if (!IsValidUuid(UploadId)) {
        return null;
    }

    const redis = await RedisConnection;
    const raw = await redis.get(SessionKey(UploadId));

    if (!raw) {
        return null;
    }

    const session: UploadSession = JSON.parse(raw);

    return session.userId === UserId ? session : null;
}


export class UploadBusiness {
    static IsSupportedFile(FileName: string): boolean {
        return GetAllowedExtensions().includes(path.extname(FileName).toLowerCase());
    }


    static async DoInitiate(UserId: string, FileName: string, FileSize: number): Promise<UploadInitiateResult> {
        const extension = path.extname(FileName).toLowerCase();
        const uploadId = uuidv7();
        const totalChunks = Math.ceil(FileSize / ChunkSize);

        // T_DATASET insert + T_USER_STORAGE quota bump happen together so the pending row
        // and the quota delta can never drift. Downstream fs setup and Redis writes remain
        // outside the transaction — the same as before this change, so their failure modes
        // are unchanged (an orphan row that a later sweep can tidy).
        const pool = await ConnectionPool;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            await connection.execute(
                `INSERT INTO T_DATASET
                    (dataset_uid, filename, extension, filesize, status, created_by, initiated_on)
                 VALUES (?, ?, ?, ?, ?, ?, NOW(3))`,
                [uploadId, path.parse(FileName).name, extension, FileSize, FileUploadStatus.INIT, Number(UserId)]
            );

            const [quotaResult] = await connection.execute<ResultSetHeader>(
                `UPDATE T_USER_STORAGE
                 SET used_storage = used_storage + ?
                 WHERE user_id = ?`,
                [FileSize, Number(UserId)]
            );

            if (quotaResult.affectedRows === 0) {
                // No quota row means registration never set one up. Don't fail the upload
                // over it — just surface it so an operator can backfill the row.
                await Logger.Info(`User ${UserId} has no T_USER_STORAGE row; used_storage not updated.`, UserId);
            }

            await connection.commit();
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

        const filePath = GetFilePath(uploadId, extension);
        await fs.mkdir(path.dirname(filePath), { recursive: true });

        const handle = await fs.open(filePath, "w");
        try {
            await handle.truncate(FileSize);
        } finally {
            await handle.close();
        }

        const session: UploadSession = { userId: UserId, extension, fileSize: FileSize, chunkSize: ChunkSize, totalChunks };

        const redis = await RedisConnection;
        await redis.set(SessionKey(uploadId), JSON.stringify(session), { EX: UploadSessionTtlSeconds });

        await Logger.Info(`Upload initiated: ${uploadId} (${path.parse(FileName).name}${extension}, ${FileSize} bytes, ${totalChunks} chunks).`, UserId);

        return { uploadId, chunkSize: ChunkSize, totalChunks };
    }


    // Returns an error message, or null when the chunk was written.
    static async DoUploadChunk(UserId: string, UploadId: string, Index: number, Data: Buffer): Promise<string | null> {
        const session = await GetSession(UploadId, UserId);

        if (!session) {
            return "Upload session not found or expired.";
        }

        if (!Number.isInteger(Index) || Index < 0 || Index >= session.totalChunks) {
            return "Invalid chunk index.";
        }

        const offset = Index * session.chunkSize;
        const expectedLength = Math.min(session.chunkSize, session.fileSize - offset);

        if (Data.length !== expectedLength) {
            return `Invalid chunk size. Expected ${expectedLength} bytes.`;
        }

        const handle = await fs.open(GetFilePath(UploadId, session.extension), "r+");
        try {
            await handle.write(Data, 0, Data.length, offset);
        } finally {
            await handle.close();
        }

        const redis = await RedisConnection;
        await redis.sAdd(ChunksKey(UploadId), String(Index));
        await redis.expire(ChunksKey(UploadId), UploadSessionTtlSeconds);

        const pool = await ConnectionPool;
        await pool.execute(
            `UPDATE T_DATASET SET status = ? WHERE dataset_uid = ? AND status = ?`,
            [FileUploadStatus.UPLOADING, UploadId, FileUploadStatus.INIT]
        );

        return null;
    }


    // Returns an error message, or null when the upload is complete.
    static async DoComplete(UserId: string, UploadId: string): Promise<string | null> {
        const session = await GetSession(UploadId, UserId);

        if (!session) {
            return "Upload session not found or expired.";
        }

        const redis = await RedisConnection;
        const received = await redis.sCard(ChunksKey(UploadId));

        if (received !== session.totalChunks) {
            return `Upload incomplete. Received ${received} of ${session.totalChunks} chunks.`;
        }

        const stat = await fs.stat(GetFilePath(UploadId, session.extension));

        if (stat.size !== session.fileSize) {
            return "Uploaded file size does not match.";
        }

        const pool = await ConnectionPool;
        await pool.execute(
            `UPDATE T_DATASET
             SET status = ?,
                 upload_completed_on = NOW(3),
                 uploading_time = TIMESTAMPDIFF(MICROSECOND, initiated_on, NOW(3)) DIV 1000
             WHERE dataset_uid = ?`,
            [FileUploadStatus.COMPLETED, UploadId]
        );

        await redis.del([SessionKey(UploadId), ChunksKey(UploadId)]);

        await Logger.Info(`Upload completed: ${UploadId} (${session.fileSize} bytes).`, UserId);

        return null;
    }
}
