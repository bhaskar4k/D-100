// Registry of every RabbitMQ queue the worker-job layer manages. Each job registers its queue
// descriptor at module load so the Processing dashboard can list queues (and their live
// in-flight counts) without hard-coding each one.
export interface QueueDescriptor {
    DisplayName: string;
    QueueName: string;
    MaxParallel: number;
    GetProcessingCount: () => number;
}

export class QueueRegistry {
    private static readonly Queues: QueueDescriptor[] = [];

    static Register(Descriptor: QueueDescriptor): void {
        const existingIndex = QueueRegistry.Queues.findIndex((Q) => Q.QueueName === Descriptor.QueueName);

        if (existingIndex >= 0) {
            // Hot reload safety: replace so a stale closure (e.g. from a reloaded module) is
            // not left pointing at an old counter.
            QueueRegistry.Queues[existingIndex] = Descriptor;
            return;
        }

        QueueRegistry.Queues.push(Descriptor);
    }

    static GetAll(): readonly QueueDescriptor[] {
        return QueueRegistry.Queues;
    }
}
