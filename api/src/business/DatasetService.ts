import { validate as IsValidUuid } from "uuid";
import { RowDataPacket } from "mysql2";
import { ConnectionPool } from "../data-access-layer/database";
import { FileUploadStatus } from "../enum/FileUploadStatus";
import { DatasetProcessingStatus } from "../enum/DatasetProcessingStatus";
import { DatasetCountRow, DatasetPage, DatasetRow } from "../entity/DatasetEntity";
import { DatasetProcessingQueue, GetRabbitMqChannel } from "../config/RabbitMqConfig";

interface DatasetOwnerRow extends RowDataPacket {
    id: number;
    created_by: number;
    status: number;
    processing_status: number;
}

const StatusLabels: Record<string, FileUploadStatus> = {
    initiated: FileUploadStatus.INIT,
    uploading: FileUploadStatus.UPLOADING,
    completed: FileUploadStatus.COMPLETED
};


// Builds the WHERE clause for a search over file name (with or without extension), extension and status label.
function BuildSearch(Search: string): { where: string; params: any[] } {
    if (!Search) {
        return { where: "", params: [] };
    }

    const term = Search.toLowerCase();
    const like = `%${term.replace(/[\\%_]/g, "\\$&")}%`;

    const clauses = ["filename LIKE ?", "extension LIKE ?", "CONCAT(filename, extension) LIKE ?"];
    const params: any[] = [like, like, like];

    const matchedStatuses = Object.entries(StatusLabels)
        .filter(([label]) => label.includes(term))
        .map(([, status]) => status);

    if (matchedStatuses.length > 0) {
        clauses.push(`status IN (${matchedStatuses.map(() => "?").join(", ")})`);
        params.push(...matchedStatuses);
    }

    return { where: `WHERE ${clauses.join(" OR ")}`, params };
}


export class DatasetService {
    static async GetDatasets(Page: number, PageSize: number, Search: string = ""): Promise<DatasetPage> {
        try {
            const pool = await ConnectionPool;
            const { where, params } = BuildSearch(Search);

            const [countRows] = await pool.query<DatasetCountRow[]>(
                `SELECT COUNT(*) AS total FROM T_DATASET ${where}`,
                params
            );

            const [rows] = await pool.query<DatasetRow[]>(
                `SELECT dataset_uid, filename, extension, filesize, status,
                        created_on, initiated_on, upload_completed_on, uploading_time
                 FROM T_DATASET
                 ${where}
                 ORDER BY id DESC
                 LIMIT ? OFFSET ?`,
                [...params, PageSize, (Page - 1) * PageSize]
            );

            return {
                items: rows.map((row) => ({
                    datasetUid: row.dataset_uid,
                    fileName: row.filename,
                    extension: row.extension,
                    fileSize: Number(row.filesize),
                    status: row.status,
                    uploadInitiatedOn: row.initiated_on,
                    uploadCompletedOn: row.upload_completed_on,
                    uploadingTime: row.uploading_time === null ? null : Number(row.uploading_time),
                    uploadedOn: row.created_on
                })),
                total: Number(countRows[0].total),
                page: Page,
                pageSize: PageSize
            };
        } catch (error: any) {
            throw error;
        }
    }


    // Enqueues a completed dataset for background processing. Returns an error message when the
    // dataset doesn't exist, doesn't belong to the caller, or isn't eligible for processing; null
    // once it has been marked IN_QUEUE and its primary key published to RabbitMQ.
    static async Process(UserId: number, DatasetUid: string): Promise<string | null> {
        if (!DatasetUid || !IsValidUuid(DatasetUid)) {
            return "A valid dataset identifier is required.";
        }

        const pool = await ConnectionPool;

        const [rows] = await pool.query<DatasetOwnerRow[]>(
            `SELECT id, created_by, status, processing_status
             FROM T_DATASET
             WHERE dataset_uid = ? AND is_active = 1
             LIMIT 1`,
            [DatasetUid]
        );

        if (rows.length === 0) {
            return "Dataset not found.";
        }

        const dataset = rows[0];

        if (Number(dataset.created_by) !== Number(UserId)) {
            return "You do not have access to this dataset.";
        }

        if (dataset.status !== FileUploadStatus.COMPLETED) {
            return "Dataset upload is not complete yet.";
        }

        if (dataset.processing_status === DatasetProcessingStatus.IN_QUEUE
            || dataset.processing_status === DatasetProcessingStatus.PROCESSING) {
            return "Dataset is already queued or being processed.";
        }

        if (dataset.processing_status === DatasetProcessingStatus.PROCESSED) {
            return "Dataset is already processed.";
        }

        await pool.execute(
            `UPDATE T_DATASET
             SET processing_status = ?, processing_initiated_on = NOW(3),
                 processing_completed_on = NULL, processing_time = NULL
             WHERE id = ?`,
            [DatasetProcessingStatus.IN_QUEUE, dataset.id]
        );

        // Enqueue the primary key (not the uid) so consumers can read/update the row directly.
        const channel = GetRabbitMqChannel();
        await channel.assertQueue(DatasetProcessingQueue, { durable: true });
        channel.sendToQueue(
            DatasetProcessingQueue,
            Buffer.from(JSON.stringify({ datasetId: Number(dataset.id) })),
            { persistent: true, contentType: "application/json" }
        );

        return null;
    }
}
