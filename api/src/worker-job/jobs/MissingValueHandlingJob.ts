import { ConnectionPool } from "../../data-access-layer/database";
import { GetRabbitMqChannel } from "../../config/RabbitMqConfig";
import { DatasetProcessingStatus } from "../../enum/DatasetProcessingStatus";
import { TrueFalse } from "../../enum/CommonEnum";
import { RunPython } from "../../python-manager/PythonManager";
import { Logger } from "../../log/Logger";
import { BuildIngestFilePath } from "../../util/UploadUtil";
import { MissingValueHandlingQueuePayload } from "../../entity/DataCleaningEntity";
import { QueueRegistry } from "../QueueRegistry";

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
         SET is_processed = ?,
             processing_status = ?,
             processing_initiated_on = NOW(3),
             processing_completed_on = NULL,
             processing_time = NULL
         WHERE id = ?`,
        [TrueFalse.False, DatasetProcessingStatus.PROCESSING, DatasetId]
    );
}


async function MarkFinished(DatasetId: number, Status: DatasetProcessingStatus): Promise<void> {
    const pool = await ConnectionPool;

    await pool.execute(
        `UPDATE T_DATASET
         SET is_processed = ?,
             processing_status = ?,
             processing_completed_on = NOW(3),
             processing_time = TIMESTAMPDIFF(MICROSECOND, processing_initiated_on, NOW(3)) DIV 1000
         WHERE id = ?`,
        [TrueFalse.True, Status, DatasetId]
    );
}


async function HandleMissingValueJob(Payload: MissingValueHandlingQueuePayload): Promise<void> {
    try {
        await MarkStarted(Payload.datasetId);

        const FilePath = BuildIngestFilePath(Payload.datasetUid, INGEST_UPLOAD_PATH!, UploadedFileName);

        const response = await RunPython<{ filePath: string; columnName: string; strategy: string; remainingNullCount: number }>(
            "HandleMissingValue",
            {
                FilePath,
                ColumnName: Payload.columnName,
                ReplacementStrategy: Payload.strategyEnum,
                ConstantValue: Payload.constantValue
            },
            ProcessingTimeoutMs
        );

        if (!response.success) {
            throw new Error(`Python returned error (HandleMissingValue): ${response.message}`);
        }

        await MarkFinished(Payload.datasetId, DatasetProcessingStatus.PROCESSED);

        await Logger.Info(
            `Missing-value handling finished for dataset ${Payload.datasetId}, column '${Payload.columnName}', strategy '${Payload.strategyEnum}' (remaining nulls: ${response.data?.remainingNullCount ?? "?"}).`
        );
    } catch (error) {
        await MarkFinished(Payload.datasetId, DatasetProcessingStatus.FAILED);
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

                if (!Number.isFinite(datasetId) || datasetId <= 0
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
