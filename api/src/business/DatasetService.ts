import { ConnectionPool } from "../data-access-layer/database";
import { DatasetCountRow, DatasetPage, DatasetRow } from "../entity/DatasetEntity";

export class DatasetService {
    static async GetDatasets(Page: number, PageSize: number): Promise<DatasetPage> {
        try {
            const pool = await ConnectionPool;

            const [countRows] = await pool.query<DatasetCountRow[]>(
                `SELECT COUNT(*) AS total FROM T_DATASET`
            );

            const [rows] = await pool.query<DatasetRow[]>(
                `SELECT dataset_uid, filename, extension, filesize, status,
                        created_on, initiated_on, upload_completed_on, uploading_time
                 FROM T_DATASET
                 ORDER BY id DESC
                 LIMIT ? OFFSET ?`,
                [PageSize, (Page - 1) * PageSize]
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
}
