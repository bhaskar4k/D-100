export enum DatasetProcessingStatus {
    NOT_INITIATED = 0,
    IN_QUEUE = 1,
    PROCESSING = 2,
    PROCESSED = 3,
    FAILED = 4,
}

export const DATASET_PROCESSING_STATUS_LABEL: Record<number, { label: string; color: string }> = {
    [DatasetProcessingStatus.NOT_INITIATED]: { label: 'Not Initiated', color: 'status-processing-not-initiated' },
    [DatasetProcessingStatus.IN_QUEUE]: { label: 'In Queue', color: 'status-processing-queued' },
    [DatasetProcessingStatus.PROCESSING]: { label: 'Processing', color: 'status-processing-running' },
    [DatasetProcessingStatus.PROCESSED]: { label: 'Processed', color: 'status-processing-done' },
    [DatasetProcessingStatus.FAILED]: { label: 'Failed', color: 'status-processing-failed' },
};
