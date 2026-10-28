export interface QueueStatus {
    displayName: string;
    queueName: string;
    inQueue: number;
    processing: number;
    maxParallel: number;
}
