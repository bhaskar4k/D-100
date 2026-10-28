import { GetRabbitMqChannel } from "../config/RabbitMqConfig";
import { QueueRegistry } from "../worker-job/QueueRegistry";
import { Logger } from "../log/Logger";

export interface QueueStatus {
    displayName: string;
    inQueue: number;
    processing: number;
    maxParallel: number;
}


export class ProcessingService {
    // Snapshot of every registered RabbitMQ queue the worker-job layer owns. For each queue it
    // reports `inQueue` (ready messages waiting in the broker) and `processing` (jobs currently
    // being handled by this worker, capped at maxParallel by the job's own semaphore).
    //
    // The queue list comes from QueueRegistry rather than env vars so new queues wire in
    // automatically when their jobs are added.
    static async GetQueueStatus(): Promise<QueueStatus[]> {
        const channel = GetRabbitMqChannel();
        const descriptors = QueueRegistry.GetAll();
        const results: QueueStatus[] = [];

        for (const Q of descriptors) {
            let inQueue = 0;

            try {
                // assertQueue is idempotent (durable:true matches how the jobs create it) and
                // returns messageCount, so this is safe to call on a fresh server where the
                // queue has not been touched yet.
                const info = await channel.assertQueue(Q.QueueName, { durable: true });
                inQueue = info.messageCount;
            } catch (error) {
                await Logger.Error(`GetQueueStatus: assertQueue failed for '${Q.QueueName}'.`, error);
            }

            results.push({
                displayName: Q.DisplayName,
                inQueue,
                processing: Q.GetProcessingCount(),
                maxParallel: Q.MaxParallel
            });
        }

        return results;
    }
}
