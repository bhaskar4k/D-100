import path from "path";
import { RowDataPacket } from "mysql2";
import { ConnectionPool } from "../../data-access-layer/database";
import { GetRabbitMqChannel } from "../../config/RabbitMqConfig";
import { DatasetProcessingStatus } from "../../enum/DatasetProcessingStatus";
import { TrueFalse } from "../../enum/CommonEnum";
import { RunPython } from "../../python-manager/PythonManager";
import { Logger } from "../../log/Logger";
import { BuildRawFilePath, BuildIngestFilePath } from "../../util/UploadUtil";
import { QueueRegistry } from "../QueueRegistry";

const RAW_UPLOAD_PATH = process.env.RAW_UPLOAD_PATH;
const INGEST_UPLOAD_PATH = process.env.INGEST_UPLOAD_PATH;
const UploadedFileName = process.env.UPLOAD_FILE_NAME || "UploadedFile";
const ProcessingTimeoutMs = Number(process.env.DATASET_PROCESSING_TIMEOUT_MS) || 30 * 60 * 1000;
const MaxParallelProcessing = Math.max(1, Number(process.env.DATASET_PROCESSING_MAX_PARALLEL) || 5);
const DatasetProcessingQueue = process.env.RABBITMQ_DATASET_PROCESSING_QUEUE_NAME || "DATASET_PROCESSING";


if (!RAW_UPLOAD_PATH) {
    throw new Error("RAW_UPLOAD_PATH is not configured in .env");
}

if (!INGEST_UPLOAD_PATH) {
    throw new Error("INGEST_UPLOAD_PATH is not configured in .env");
}


interface DatasetRow extends RowDataPacket {
    id: number;
    dataset_uid: string;
    extension: string;
}

interface ColumnMetadata {
    name: string;
    type: number;
    nullable: boolean;
    uniqueCount: number;
}

interface FileMetadata {
    rowCount: number;
    columnInfo: ColumnMetadata[];
}


// Caps how many datasets process concurrently across ticks. State is module-level so a slot held
// by a job launched on tick N is still held when tick N+1 fires.
class Semaphore {
    private Available: number;
    private readonly Waiters: Array<() => void> = [];

    constructor(private readonly Max: number) {
        this.Available = Max;
    }

    async Acquire(): Promise<void> {
        if (this.Available > 0) {
            this.Available -= 1;
            return;
        }
        await new Promise<void>((Resolve) => this.Waiters.push(Resolve));
    }

    Release(): void {
        const Next = this.Waiters.shift();
        if (Next) {
            Next();
            return;
        }
        if (this.Available < this.Max) {
            this.Available += 1;
        }
    }
}

const ProcessingSemaphore = new Semaphore(MaxParallelProcessing);


// Live counter of how many ProcessDataset calls are in-flight. Incremented when the handler
// starts, decremented in its finally. Exposed to QueueRegistry so the Processing dashboard can
// show "N of M processing" for this queue.
let ActiveJobCount = 0;

QueueRegistry.Register({
    DisplayName: "Dataset Processing",
    QueueName: DatasetProcessingQueue,
    MaxParallel: MaxParallelProcessing,
    GetProcessingCount: () => ActiveJobCount
});


async function MarkFailed(DatasetId: number): Promise<void> {
    const pool = await ConnectionPool;

    await pool.execute(
        `UPDATE T_DATASET
         SET processing_status = ?,
             processing_completed_on = NOW(3),
             processing_time = TIMESTAMPDIFF(MICROSECOND, processing_initiated_on, NOW(3)) DIV 1000
         WHERE id = ?`,
        [DatasetProcessingStatus.FAILED, DatasetId]
    );
}


// Writes rowCount + columnInfo to the DB and flips the dataset to PROCESSED. Done in one
// transaction so a partial failure never leaves half the columns inserted with the dataset
// still looking processed.
async function PersistMetadata(DatasetId: number, Metadata: FileMetadata): Promise<void> {
    const pool = await ConnectionPool;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Clear any columns from an earlier run so a reprocess doesn't leave duplicates behind.
        await connection.execute(`DELETE FROM T_COLUMN WHERE dataset_id = ?`, [DatasetId]);

        if (Metadata.columnInfo.length > 0) {
            const placeholders = Metadata.columnInfo.map(() => "(?, ?, ?, ?, ?)").join(", ");
            const values: unknown[] = [];

            for (const Column of Metadata.columnInfo) {
                values.push(
                    DatasetId,
                    Column.name,
                    Column.type,
                    Column.nullable ? TrueFalse.True : TrueFalse.False,
                    Column.uniqueCount
                );
            }

            await connection.query(
                `INSERT INTO T_COLUMN (dataset_id, column_name, type, nullable, unique_count) VALUES ${placeholders}`,
                values
            );
        }

        await connection.execute(
            `UPDATE T_DATASET
             SET row_count = ?,
                 is_processed = ?,
                 processing_status = ?,
                 processing_completed_on = NOW(3),
                 processing_time = TIMESTAMPDIFF(MICROSECOND, processing_initiated_on, NOW(3)) DIV 1000
             WHERE id = ?`,
            [Metadata.rowCount, TrueFalse.True, DatasetProcessingStatus.PROCESSED, DatasetId]
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}


async function ProcessDataset(DatasetId: number): Promise<void> {
    const pool = await ConnectionPool;

    const [rows] = await pool.query<DatasetRow[]>(
        `SELECT id, dataset_uid, extension FROM T_DATASET WHERE id = ? LIMIT 1`,
        [DatasetId]
    );

    if (rows.length === 0) {
        await Logger.Error(`Dataset ${DatasetId} not found while processing.`);
        return;
    }

    const dataset = rows[0];

    await pool.execute(
        `UPDATE T_DATASET
         SET processing_status = ?, processing_initiated_on = NOW(3)
         WHERE id = ?`,
        [DatasetProcessingStatus.PROCESSING, DatasetId]
    );

    try {
        const sourcePath = BuildRawFilePath(dataset.dataset_uid, RAW_UPLOAD_PATH!, UploadedFileName, dataset.extension);
        const targetPath = BuildIngestFilePath(dataset.dataset_uid, INGEST_UPLOAD_PATH!, UploadedFileName);

        const metadataResponse = await RunPython<FileMetadata>(
            "GetFileMetadata",
            { FilePath: sourcePath },
            ProcessingTimeoutMs
        );

        if (!metadataResponse.success || metadataResponse.data === null || metadataResponse.data === undefined) {
            throw new Error(`Python returned error (GetFileMetadata): ${metadataResponse.message}`);
        }

        const conversionResponse = await RunPython<{ targetPath: string; targetSize: number | null }>(
            "ConvertToParquet",
            { SourcePath: sourcePath, TargetPath: targetPath },
            ProcessingTimeoutMs
        );

        if (!conversionResponse.success) {
            throw new Error(`Python returned error (ConvertToParquet): ${conversionResponse.message}`);
        }

        await PersistMetadata(DatasetId, metadataResponse.data);

        await Logger.Info(
            `Dataset ${DatasetId} processed (${metadataResponse.data.rowCount} rows, ${metadataResponse.data.columnInfo.length} columns, parquet at ${targetPath}).`
        );
    } catch (error) {
        await MarkFailed(DatasetId);
        await Logger.Error(`Dataset ${DatasetId} processing failed.`, error);
    }
}


// Called by the worker-job scheduler. Pulls messages from the RabbitMQ queue and launches each
// one as a background task, capped at MaxParallelProcessing by the module-level semaphore. The
// loop blocks on Acquire when every slot is in use, so a new message only leaves the queue once
// a running job frees a slot. The outer WorkerJob guards against overlapping ticks, so the next
// tick cannot start until this one returns -- which happens as soon as the queue is drained,
// leaving the launched jobs to finish on their own.
export async function DatasetProcessingTick(): Promise<void> {
    const channel = GetRabbitMqChannel();
    await channel.assertQueue(DatasetProcessingQueue, { durable: true });

    while (true) {
        await ProcessingSemaphore.Acquire();

        const message = await channel.get(DatasetProcessingQueue, { noAck: false });

        if (message === false) {
            ProcessingSemaphore.Release();
            break;
        }

        ActiveJobCount += 1;

        void (async () => {
            try {
                const payload = JSON.parse(message.content.toString()) as { datasetId?: number };
                const datasetId = Number(payload?.datasetId);

                if (!Number.isFinite(datasetId) || datasetId <= 0) {
                    await Logger.Error(`DatasetProcessing: invalid payload '${message.content.toString()}'`);
                    channel.ack(message);
                    return;
                }

                await ProcessDataset(datasetId);
                channel.ack(message);
            } catch (error) {
                await Logger.Error("DatasetProcessing: tick error.", error);
                // Discard rather than requeue so a poisoned message cannot loop forever; the
                // dataset row is already flipped to FAILED by MarkFailed in ProcessDataset's
                // inner catch.
                channel.nack(message, false, false);
            } finally {
                ActiveJobCount -= 1;
                ProcessingSemaphore.Release();
            }
        })();
    }
}
