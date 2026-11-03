import fs from "fs/promises";
import { ConnectionPool } from "../../data-access-layer/database";
import { GetRabbitMqChannel } from "../../config/RabbitMqConfig";
import { DatasetProcessingStatus } from "../../enum/DatasetProcessingStatus";
import { TrueFalse } from "../../enum/CommonEnum";
import { DatasetHistoryActionType } from "../../enum/DatasetHistoryActionType";
import { RunPython } from "../../python-manager/PythonManager";
import { Logger } from "../../log/Logger";
import { BuildIngestFilePath } from "../../util/UploadUtil";
import { MissingValueHandlingQueuePayload } from "../../entity/DataCleaningEntity";
import { QueueRegistry } from "../QueueRegistry";
import { ColumnMetadata, HandleMissingValuePythonResponse } from "../../entity/DataCleaningEntity";
import { BuildColumnStateFromMetadata, BuildColumnStateFromRow } from "../../util/audit/MissingValueHandling";


const INGEST_UPLOAD_PATH = process.env.INGEST_UPLOAD_PATH;
const UploadedFileName = process.env.UPLOAD_FILE_NAME || "UploadedFile";
const ProcessingTimeoutMs = Number(process.env.DATASET_PROCESSING_TIMEOUT_MS) || 30 * 60 * 1000;
const MaxParallelProcessing = Math.max(1, Number(process.env.MISSING_VALUE_HANDLING_MAX_PARALLEL) || 5);
const MissingValueHandlingQueue = process.env.RABBITMQ_MISSING_VALUE_HANDLING_QUEUE_NAME || "MISSING_VALUE_HANDLING";


if (!INGEST_UPLOAD_PATH) {
    throw new Error("INGEST_UPLOAD_PATH is not configured in .env");
}



// Caps how many missing-value handling jobs process concurrently across ticks. State is
// module-level so a slot held by a job launched on tick N is still held when tick N+1 fires.
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


// Live counter of how many HandleMissingValue calls are in-flight. Exposed to QueueRegistry so
// the Processing dashboard can show "N of M processing" for this queue.
let ActiveJobCount = 0;

QueueRegistry.Register({
    DisplayName: "Missing Value Handling",
    QueueName: MissingValueHandlingQueue,
    MaxParallel: MaxParallelProcessing,
    GetProcessingCount: () => ActiveJobCount
});


async function MarkStarted(DatasetId: number): Promise<void> {
    const pool = await ConnectionPool;

    await pool.execute(
        `UPDATE T_DATASET
         SET processing_status = ?,
         processing_initiated_on = NOW(3)
         WHERE id = ?`,
        [DatasetProcessingStatus.PROCESSING, DatasetId]
    );
}


async function MarkFailed(DatasetId: number): Promise<void> {
    const pool = await ConnectionPool;

    await pool.execute(
        `UPDATE T_DATASET
         SET is_processed = ?,
             processing_status = ?,
             processing_completed_on = NOW(3),
             processing_time = TIMESTAMPDIFF(MICROSECOND, processing_initiated_on, NOW(3)) DIV 1000
         WHERE id = ?`,
        [TrueFalse.True, DatasetProcessingStatus.FAILED, DatasetId]
    );
}


// Writes the column's fresh metadata, the dataset's final status, and a T_DATASET_HISTORY row
// capturing the before/after column state — all in one DB transaction, so a partial failure
// never leaves one of the three updated while the other two are not.
async function CommitSuccess(
    DatasetId: number,
    ColumnId: number,
    Metadata: ColumnMetadata
): Promise<void> {
    const pool = await ConnectionPool;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Pull the column's current row inside the transaction with FOR UPDATE so a concurrent
        // writer cannot slip in between our read and our update. This is both the previous
        // state we record in history and the existence check for the row.
        const [prevRows]: any = await connection.query(
            `SELECT type, nullable, unique_count, null_value_count
             FROM T_COLUMN
             WHERE id = ? AND dataset_id = ?
             LIMIT 1
             FOR UPDATE`,
            [ColumnId, DatasetId]
        );

        if (!prevRows || prevRows.length === 0) {
            // Something deleted the column while we were working. Treat it as a hard failure
            // so the caller rolls the file change back.
            throw new Error(`Column ${ColumnId} not found for dataset ${DatasetId}; aborting commit.`);
        }

        const previousState = BuildColumnStateFromRow(prevRows[0]);

        await connection.execute(
            `UPDATE T_COLUMN
             SET type = ?,
                 nullable = ?,
                 unique_count = ?,
                 null_value_count = ?,
                 modified_on = NOW(3)
             WHERE id = ? AND dataset_id = ?`,
            [
                Metadata.type,
                Metadata.nullable ? TrueFalse.True : TrueFalse.False,
                Metadata.uniqueCount,
                Metadata.nullValueCount,
                ColumnId,
                DatasetId
            ]
        );

        const currentState = BuildColumnStateFromMetadata(Metadata.type, Metadata.nullable, Metadata.uniqueCount, Metadata.nullValueCount);

        await connection.execute(
            `INSERT INTO T_DATASET_HISTORY
                (dataset_id, action_type, column_id, previous_state, current_state)
             VALUES (?, ?, ?, ?, ?)`,
            [
                DatasetId,
                DatasetHistoryActionType.MISSING_VALUE_HANDLING,
                ColumnId,
                JSON.stringify(previousState),
                JSON.stringify(currentState)
            ]
        );

        await connection.execute(
            `UPDATE T_DATASET
             SET is_processed = ?,
                 processing_status = ?,
                 processing_completed_on = NOW(3),
                 processing_time = TIMESTAMPDIFF(MICROSECOND, processing_initiated_on, NOW(3)) DIV 1000
             WHERE id = ?`,
            [TrueFalse.True, DatasetProcessingStatus.PROCESSED, DatasetId]
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}


async function RestoreFromBackup(FilePath: string, BackupPath: string): Promise<void> {
    try {
        await fs.rename(BackupPath, FilePath);
    } catch (error) {
        await Logger.Error(
            `Failed to restore parquet from backup. The dataset file may be stale. BackupPath='${BackupPath}', FilePath='${FilePath}'.`,
            error
        );
    }
}


async function DeleteBackup(BackupPath: string): Promise<void> {
    try {
        await fs.unlink(BackupPath);
    } catch (error) {
        // Best-effort cleanup: a leftover .bak is not a correctness problem, just noise on disk.
        await Logger.Error(`Failed to delete missing-value backup at '${BackupPath}'.`, error);
    }
}


async function HandleMissingValueJob(Payload: MissingValueHandlingQueuePayload): Promise<void> {
    const FilePath = BuildIngestFilePath(Payload.datasetUid, INGEST_UPLOAD_PATH!, UploadedFileName);

    let backupPath: string | null = null;

    try {
        await MarkStarted(Payload.datasetId);

        const response = await RunPython<HandleMissingValuePythonResponse>(
            "HandleMissingValue",
            {
                FilePath,
                ColumnName: Payload.columnName,
                ReplacementStrategy: Payload.strategyEnum,
                ConstantValue: Payload.constantValue
            },
            ProcessingTimeoutMs
        );

        if (!response.success || !response.data) {
            // Python already rolled its own temp/backup state back, so FilePath is unchanged.
            throw new Error(`Python returned error (HandleMissingValue): ${response.message}`);
        }

        backupPath = response.data.backupPath;

        try {
            await CommitSuccess(Payload.datasetId, Payload.columnId, response.data.columnMetadata);
        } catch (dbError) {
            // The parquet is already swapped on disk but the DB commit failed. Rename the
            // backup back over the live file so the dataset's on-disk state matches the DB
            // row that is about to be flipped to FAILED.
            await RestoreFromBackup(FilePath, backupPath);
            backupPath = null;
            throw dbError;
        }

        // DB and file are both committed. The backup is no longer needed.
        await DeleteBackup(backupPath);
        backupPath = null;

        await Logger.Info(
            `Missing-value handling finished for dataset ${Payload.datasetId}, column '${Payload.columnName}', strategy '${Payload.strategyEnum}' (nulls left: ${response.data.columnMetadata.nullValueCount}).`
        );
    } catch (error) {
        if (backupPath) {
            // Belt and braces: if we somehow left the catch above with a backup still on disk,
            // restore it here before marking FAILED.
            await RestoreFromBackup(FilePath, backupPath);
        }

        await MarkFailed(Payload.datasetId);

        await Logger.Error(
            `Missing-value handling failed for dataset ${Payload.datasetId}, column '${Payload.columnName}', strategy '${Payload.strategyEnum}'.`,
            error
        );
    }
}


// Called by the worker-job scheduler. Pulls messages from the RabbitMQ queue and launches each
// one as a background task, capped at MaxParallelProcessing by the module-level semaphore. The
// outer WorkerJob guards against overlapping ticks, so the next tick cannot start until this
// one returns -- which happens as soon as the queue is drained, leaving the launched jobs to
// finish on their own.
export async function MissingValueHandlingTick(): Promise<void> {
    const channel = GetRabbitMqChannel();
    await channel.assertQueue(MissingValueHandlingQueue, { durable: true });

    while (true) {
        await ProcessingSemaphore.Acquire();

        const message = await channel.get(MissingValueHandlingQueue, { noAck: false });

        if (message === false) {
            ProcessingSemaphore.Release();
            break;
        }

        ActiveJobCount += 1;

        void (async () => {
            try {
                const payload = JSON.parse(message.content.toString()) as Partial<MissingValueHandlingQueuePayload>;
                const datasetId = Number(payload?.datasetId);
                const columnId = Number(payload?.columnId);

                if (!Number.isFinite(datasetId) || datasetId <= 0
                    || !Number.isFinite(columnId) || columnId <= 0
                    || !payload.datasetUid || !payload.columnName || !payload.strategyEnum) {
                    await Logger.Error(`MissingValueHandling: invalid payload '${message.content.toString()}'`);
                    channel.ack(message);
                    return;
                }

                await HandleMissingValueJob(payload as MissingValueHandlingQueuePayload);
                channel.ack(message);
            } catch (error) {
                await Logger.Error("MissingValueHandling: tick error.", error);
                // Discard rather than requeue so a poisoned message cannot loop forever; the
                // dataset row is already flipped to FAILED in HandleMissingValueJob's inner
                // catch.
                channel.nack(message, false, false);
            } finally {
                ActiveJobCount -= 1;
                ProcessingSemaphore.Release();
            }
        })();
    }
}
