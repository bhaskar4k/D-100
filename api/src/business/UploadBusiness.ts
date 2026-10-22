import fs from "fs/promises";
import path from "path";
import { v7 as uuidv7, validate as IsValidUuid } from "uuid";
import { RedisConnection } from "../config/RedisConfig";
import { UploadInitiateResult, UploadSession } from "../entity/UploadEntity";

const RAW_UPLOAD_PATH = process.env.RAW_UPLOAD_PATH;

if (!RAW_UPLOAD_PATH) {
    throw new Error("RAW_UPLOAD_PATH is not configured in .env");
}

export const ChunkSize = 8 * 1024 * 1024;
export const AllowedExtensions = [".xlsx", ".xls", ".csv", ".parquet"];

const UploadSessionTtlSeconds = 24 * 60 * 60;
const UploadedFileName = "UploadedFile";


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
        return AllowedExtensions.includes(path.extname(FileName).toLowerCase());
    }


    static async DoInitiate(UserId: string, FileName: string, FileSize: number): Promise<UploadInitiateResult> {
        const extension = path.extname(FileName).toLowerCase();
        const uploadId = uuidv7();
        const totalChunks = Math.ceil(FileSize / ChunkSize);

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

        await redis.del([SessionKey(UploadId), ChunksKey(UploadId)]);

        return null;
    }
}
