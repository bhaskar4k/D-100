import path from "path";
import { validate as IsValidUuid } from "uuid";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { ConnectionPool } from "../data-access-layer/database";
import { FileUploadStatus } from "../enum/FileUploadStatus";
import { DatasetProcessingStatus } from "../enum/DatasetProcessingStatus";
import { DatasetCountRow, DatasetPage, DatasetRow } from "../entity/DatasetEntity";
import { DatasetProcessingQueue, GetRabbitMqChannel } from "../config/RabbitMqConfig";
import { StatusLabels } from "../enum/FileUploadStatus";
import { DatasetColumnItem, DatasetColumnRow, DatasetDetailItem, DatasetDetailResult, DatasetDetailRow, DatasetOwnerRow } from "../entity/DatasetEntity";
import { TrueFalse } from "../enum/CommonEnum";
import { RunPython } from "../python-manager/PythonManager";

const INGEST_UPLOAD_PATH = process.env.INGEST_UPLOAD_PATH;
const UploadedFileName = process.env.UPLOAD_FILE_NAME || "UploadedFile";
// Column removal rewrites the parquet, so match the processing job's longer timeout.
const PythonProcessingTimeoutMs = Number(process.env.DATASET_PROCESSING_TIMEOUT_MS) || 30 * 60 * 1000;

if (!INGEST_UPLOAD_PATH) {
    throw new Error("INGEST_UPLOAD_PATH is not configured in .env");
}

function BuildIngestFilePath(DatasetUid: string): string {
    return path.join(path.resolve(INGEST_UPLOAD_PATH!), DatasetUid, `${UploadedFileName}.parquet`);
}

interface ColumnLookupRow extends RowDataPacket {
    column_name: string;
}


// Builds the WHERE clause for the owning user, plus an optional search over file name (with or
// without extension), extension and status label. Owner and is_active filters are always
// present so one user never sees another user's datasets or soft-deleted rows.
function BuildWhere(UserId: number, Search: string, IsActive: TrueFalse = TrueFalse.True): { where: string; params: any[] } {
    const clauses: string[] = ["created_by = ?", "is_active = ?"];
    const params: any[] = [UserId, IsActive];

    if (!Search) {
        return { where: `WHERE ${clauses.join(" AND ")}`, params };
    }

    const term = Search.toLowerCase();
    const like = `%${term.replace(/[\\%_]/g, "\\$&")}%`;

    const searchClauses = ["filename LIKE ?", "extension LIKE ?", "CONCAT(filename, extension) LIKE ?"];
    const searchParams: any[] = [like, like, like];

    const matchedStatuses = Object.entries(StatusLabels)
        .filter(([label]) => label.includes(term))
        .map(([, status]) => status);

    if (matchedStatuses.length > 0) {
        searchClauses.push(`status IN (${matchedStatuses.map(() => "?").join(", ")})`);
        searchParams.push(...matchedStatuses);
    }

    clauses.push(`(${searchClauses.join(" OR ")})`);
    params.push(...searchParams);

    return { where: `WHERE ${clauses.join(" AND ")}`, params };
}


export class DatasetService {
    // Get all datasets for a user. Returns a page of datasets, along with the total number of
    // datasets and the total number of pages. Returns an error message when the user doesn't exist,
    // doesn't belong to the caller, or the page number is out of range; null when the page is empty.
    static async GetDatasets(UserId: number, Page: number, PageSize: number, Search: string = ""): Promise<DatasetPage> {
        return DatasetService.GetDatasetsByActive(UserId, Page, PageSize, Search, TrueFalse.True);
    }


    // Same shape as GetDatasets but returns only soft-deleted (is_active = 0) rows, used by the
    // "Deleted datasets" view and the restore workflow.
    static async GetDeletedDatasets(UserId: number, Page: number, PageSize: number, Search: string = ""): Promise<DatasetPage> {
        return DatasetService.GetDatasetsByActive(UserId, Page, PageSize, Search, TrueFalse.False);
    }


    private static async GetDatasetsByActive(UserId: number, Page: number, PageSize: number, Search: string, IsActive: TrueFalse): Promise<DatasetPage> {
        try {
            const pool = await ConnectionPool;
            const { where, params } = BuildWhere(UserId, Search, IsActive);

            const [countRows] = await pool.query<DatasetCountRow[]>(
                `SELECT COUNT(*) AS total FROM T_DATASET ${where}`,
                params
            );

            const [rows] = await pool.query<DatasetRow[]>(
                `SELECT dataset_uid, filename, extension, filesize, status, created_on,
                        is_processed, processing_status, processing_completed_on,
                        modified_on, is_active
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
                    uploadedOn: row.created_on,
                    isProcessed: row.is_processed === TrueFalse.True ? true : false,
                    processingStatus: row.processing_status,
                    processingCompletedOn: row.processing_completed_on,
                    modifiedOn: row.modified_on,
                    isActive: row.is_active === TrueFalse.True ? true : false
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
            return "Dataset upload is not completed yet.";
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


    // Returns the full dataset record and its columns. Returns an error message when the dataset
    // doesn't exist, is soft-deleted, or doesn't belong to the caller.
    static async GetDetails(UserId: number, DatasetUid: string): Promise<DatasetDetailResult | string> {
        if (!DatasetUid || !IsValidUuid(DatasetUid)) {
            return "A valid dataset identifier is required.";
        }

        const pool = await ConnectionPool;

        const [datasetRows] = await pool.query<DatasetDetailRow[]>(
            `SELECT id, dataset_uid, filename, extension, filesize, status,
                    initiated_on, upload_completed_on, uploading_time,
                    row_count, is_processed, processing_status,
                    processing_initiated_on, processing_completed_on, processing_time,
                    created_by, created_on, modified_on, is_active
             FROM T_DATASET
             WHERE dataset_uid = ?
             LIMIT 1`,
            [DatasetUid]
        );

        if (datasetRows.length === 0) {
            return "Dataset not found.";
        }

        const row = datasetRows[0];

        if (Number(row.created_by) !== Number(UserId)) {
            return "You do not have access to this dataset.";
        }

        if (row.is_active !== TrueFalse.True) {
            return "Dataset is deleted.";
        }

        const [columnRows] = await pool.query<DatasetColumnRow[]>(
            `SELECT id, column_name, type, nullable, unique_count, modified_on
             FROM T_COLUMN
             WHERE dataset_id = ?
             ORDER BY id ASC`,
            [row.id]
        );

        const dataset: DatasetDetailItem = {
            datasetUid: row.dataset_uid,
            fileName: row.filename,
            extension: row.extension,
            fileSize: Number(row.filesize),
            status: row.status,
            uploadInitiatedOn: row.initiated_on,
            uploadCompletedOn: row.upload_completed_on,
            uploadingTime: row.uploading_time === null ? null : Number(row.uploading_time),
            uploadedOn: row.created_on,
            rowCount: row.row_count === null ? null : Number(row.row_count),
            isProcessed: row.is_processed === TrueFalse.True,
            processingStatus: row.processing_status,
            processingInitiatedOn: row.processing_initiated_on,
            processingCompletedOn: row.processing_completed_on,
            processingTime: row.processing_time === null ? null : Number(row.processing_time),
            modifiedOn: row.modified_on,
            isActive: row.is_active === TrueFalse.True,
            createdBy: Number(row.created_by)
        };

        // Every column in this dataset was ingested in the same processing run, so each column's
        // created_on is the dataset's processing_completed_on.
        const columns: DatasetColumnItem[] = columnRows.map((Column) => ({
            id: Number(Column.id),
            columnName: Column.column_name,
            type: Column.type,
            nullable: Column.nullable === TrueFalse.True,
            uniqueCount: Number(Column.unique_count),
            createdOn: row.processing_completed_on,
            modifiedOn: Column.modified_on
        }));

        return { dataset, columns };
    }


    // Renames a dataset. Returns an error message when the dataset doesn't exist, doesn't belong
    // to the caller, is deleted, or when the new name fails validation; null once filename and
    // modified_on have been updated.
    static async UpdateName(UserId: number, DatasetUid: string, NewName: string): Promise<string | null> {
        if (!DatasetUid || !IsValidUuid(DatasetUid)) {
            return "A valid dataset identifier is required.";
        }

        const trimmed = (NewName ?? "").trim();

        if (trimmed.length === 0) {
            return "Dataset name is required.";
        }

        if (trimmed.length > 255) {
            return "Dataset name must be 255 characters or fewer.";
        }

        // Disallow path separators or control chars — the filename is used later for file paths.
        if (/[\\/:*?"<>|\x00-\x1f]/.test(trimmed)) {
            return "Dataset name contains invalid characters.";
        }

        const pool = await ConnectionPool;

        const [rows] = await pool.query<DatasetOwnerRow[]>(
            `SELECT id, created_by, status, processing_status, is_processed, is_active
             FROM T_DATASET
             WHERE dataset_uid = ?
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

        if (dataset.is_active !== TrueFalse.True) {
            return "Dataset is deleted.";
        }

        await pool.execute(
            `UPDATE T_DATASET SET filename = ?, modified_on = NOW(3) WHERE id = ?`,
            [trimmed, dataset.id]
        );

        return null;
    }


    // Renames one column of a dataset in both the DB and the INGEST parquet file. RAW stays
    // untouched. The DB mutation runs in a transaction that only commits once the parquet
    // rewrite (via a sibling .tmp + atomic rename) succeeds; if the file side fails, the DB
    // side rolls back so neither layer ends up out of sync. Returns an error message on
    // failure; null on success.
    static async UpdateColumnName(UserId: number, DatasetUid: string, ColumnId: number, NewName: string): Promise<string | null> {
        if (!DatasetUid || !IsValidUuid(DatasetUid)) {
            return "A valid dataset identifier is required.";
        }

        if (!Number.isFinite(ColumnId) || ColumnId <= 0) {
            return "A valid column id is required.";
        }

        const trimmed = (NewName ?? "").trim();

        if (trimmed.length === 0) {
            return "Column name is required.";
        }

        if (trimmed.length > 500) {
            return "Column name must be 500 characters or fewer.";
        }

        if (/[\x00-\x1f]/.test(trimmed)) {
            return "Column name contains invalid characters.";
        }

        const pool = await ConnectionPool;

        const [datasetRows] = await pool.query<DatasetOwnerRow[]>(
            `SELECT id, created_by, status, processing_status, is_processed, is_active
             FROM T_DATASET
             WHERE dataset_uid = ?
             LIMIT 1`,
            [DatasetUid]
        );

        if (datasetRows.length === 0) {
            return "Dataset not found.";
        }

        const dataset = datasetRows[0];

        if (Number(dataset.created_by) !== Number(UserId)) {
            return "You do not have access to this dataset.";
        }

        if (dataset.is_active !== TrueFalse.True) {
            return "Dataset is deleted.";
        }

        if (dataset.is_processed !== TrueFalse.True) {
            return "Dataset is not processed yet.";
        }

        const [columnLookup] = await pool.query<ColumnLookupRow[]>(
            `SELECT column_name FROM T_COLUMN WHERE id = ? AND dataset_id = ? LIMIT 1`,
            [ColumnId, dataset.id]
        );

        if (columnLookup.length === 0) {
            return "Column not found for this dataset.";
        }

        const oldName = columnLookup[0].column_name;

        if (oldName === trimmed) {
            return null;
        }

        const ingestPath = BuildIngestFilePath(DatasetUid);

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Scoping the UPDATE to this dataset's id means a mismatched column id affects no
            // rows, which the affectedRows check turns into a clear 'column not found' message.
            const [result] = await connection.execute<ResultSetHeader>(
                `UPDATE T_COLUMN SET column_name = ?, modified_on = NOW(3) WHERE id = ? AND dataset_id = ?`,
                [trimmed, ColumnId, dataset.id]
            );

            if (result.affectedRows === 0) {
                await connection.rollback();
                return "Column not found for this dataset.";
            }

            await connection.execute(
                `UPDATE T_DATASET SET modified_on = NOW(3) WHERE id = ?`,
                [dataset.id]
            );

            // Python runs AFTER the DB writes but BEFORE commit: if the file rewrite fails, the
            // rollback below undoes the DB side so nothing is left out of sync.
            const response = await RunPython<{ filePath: string; oldName: string; newName: string }>(
                "RenameColumnInParquet",
                { FilePath: ingestPath, OldName: oldName, NewName: trimmed },
                PythonProcessingTimeoutMs
            );

            if (!response.success) {
                await connection.rollback();
                return response.message || "Could not rename the column in the file.";
            }

            await connection.commit();
            return null;
        } catch (error) {
            try { await connection.rollback(); } catch { /* ignore */ }
            throw error;
        } finally {
            connection.release();
        }
    }


    // Removes one column from a dataset: the row from T_COLUMN and the matching column from the
    // INGEST parquet file. RAW stays untouched. Both the DB mutation and the file rewrite must
    // succeed or neither takes effect; the file side writes to a sibling .tmp first and renames
    // atomically, and the DB mutation runs in a transaction that rolls back if the file rewrite
    // fails. Returns an error message on failure; null on success.
    static async DeleteColumn(UserId: number, DatasetUid: string, ColumnId: number): Promise<string | null> {
        if (!DatasetUid || !IsValidUuid(DatasetUid)) {
            return "A valid dataset identifier is required.";
        }

        if (!Number.isFinite(ColumnId) || ColumnId <= 0) {
            return "A valid column id is required.";
        }

        const pool = await ConnectionPool;

        const [datasetRows] = await pool.query<DatasetOwnerRow[]>(
            `SELECT id, created_by, status, processing_status, is_processed, is_active
             FROM T_DATASET
             WHERE dataset_uid = ?
             LIMIT 1`,
            [DatasetUid]
        );

        if (datasetRows.length === 0) {
            return "Dataset not found.";
        }

        const dataset = datasetRows[0];

        if (Number(dataset.created_by) !== Number(UserId)) {
            return "You do not have access to this dataset.";
        }

        if (dataset.is_active !== TrueFalse.True) {
            return "Dataset is deleted.";
        }

        if (dataset.is_processed !== TrueFalse.True) {
            return "Dataset is not processed yet.";
        }

        const [columnRows] = await pool.query<ColumnLookupRow[]>(
            `SELECT column_name FROM T_COLUMN WHERE id = ? AND dataset_id = ? LIMIT 1`,
            [ColumnId, dataset.id]
        );

        if (columnRows.length === 0) {
            return "Column not found for this dataset.";
        }

        const columnName = columnRows[0].column_name;
        const ingestPath = BuildIngestFilePath(DatasetUid);

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await connection.execute(
                `DELETE FROM T_COLUMN WHERE id = ? AND dataset_id = ?`,
                [ColumnId, dataset.id]
            );

            await connection.execute(
                `UPDATE T_DATASET SET modified_on = NOW(3) WHERE id = ?`,
                [dataset.id]
            );

            // Python runs AFTER the DB writes but BEFORE commit: if the file rewrite fails, the
            // rollback below undoes the DB side so nothing is left out of sync.
            const response = await RunPython<{ filePath: string; columnName: string }>(
                "DeleteColumnFromParquet",
                { FilePath: ingestPath, ColumnName: columnName },
                PythonProcessingTimeoutMs
            );

            if (!response.success) {
                await connection.rollback();
                return response.message || "Could not delete the column from the file.";
            }

            await connection.commit();
            return null;
        } catch (error) {
            try { await connection.rollback(); } catch { /* ignore */ }
            throw error;
        } finally {
            connection.release();
        }
    }


    // Soft-deletes a dataset (is_active = 0). Returns an error message when the dataset doesn't
    // exist, doesn't belong to the caller, is already deleted, or is currently being processed;
    // null once is_active has been flipped off. Hard delete would strand the raw file and any
    // T_COLUMN rows, which can be cleaned up separately.
    static async Delete(UserId: number, DatasetUid: string): Promise<string | null> {
        if (!DatasetUid || !IsValidUuid(DatasetUid)) {
            return "A valid dataset identifier is required.";
        }

        const pool = await ConnectionPool;

        const [rows] = await pool.query<DatasetOwnerRow[]>(
            `SELECT id, created_by, status, processing_status, is_active
             FROM T_DATASET
             WHERE dataset_uid = ?
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

        if (dataset.is_active !== TrueFalse.True) {
            return "Dataset is already deleted.";
        }

        if (dataset.processing_status === DatasetProcessingStatus.IN_QUEUE) {
            return "Dataset is currently in the processing queue. Try again once it finishes.";
        }

        if (dataset.processing_status === DatasetProcessingStatus.PROCESSING) {
            return "Dataset is currently being processed. Try again once it finishes.";
        }

        await pool.execute(
            `UPDATE T_DATASET SET is_active = ? WHERE id = ?`,
            [TrueFalse.False, dataset.id]
        );

        return null;
    }


    // Restores a soft-deleted dataset (is_active flipped back to 1). Returns an error message
    // when the dataset doesn't exist, doesn't belong to the caller, or isn't currently deleted;
    // null once is_active and modified_on have been updated.
    static async Restore(UserId: number, DatasetUid: string): Promise<string | null> {
        if (!DatasetUid || !IsValidUuid(DatasetUid)) {
            return "A valid dataset identifier is required.";
        }

        const pool = await ConnectionPool;

        const [rows] = await pool.query<DatasetOwnerRow[]>(
            `SELECT id, created_by, status, processing_status, is_processed, is_active
             FROM T_DATASET
             WHERE dataset_uid = ?
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

        if (dataset.is_active === TrueFalse.True) {
            return "Dataset is already active.";
        }

        await pool.execute(
            `UPDATE T_DATASET SET is_active = ?, modified_on = NOW(3) WHERE id = ?`,
            [TrueFalse.True, dataset.id]
        );

        return null;
    }
}
