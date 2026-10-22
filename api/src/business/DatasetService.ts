import { ConnectionPool } from "../data-access-layer/database";
import { FileUploadStatus } from "../enum/FileUploadStatus";
import { DatasetCountRow, DatasetPage, DatasetRow } from "../entity/DatasetEntity";

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
}
