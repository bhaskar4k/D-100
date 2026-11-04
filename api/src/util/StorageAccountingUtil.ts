import { ResultSetHeader } from "mysql2";
import { PoolConnection } from "mysql2/promise";
import { Logger } from "../log/Logger";


// Reconciles the on-disk size change of a dataset's ingested parquet with the two columns
// that track it in the DB:
//   • T_DATASET.filesize — what the UI shows as the dataset's current on-disk size.
//   • T_USER_STORAGE.used_storage — the owner's quota accounting.
// Called by any flow that rewrites the parquet (column drop, rename, future transforms).
// The caller owns the transaction: pass the borrowed connection in so these two UPDATEs
// commit or roll back together with the rest of the caller's work.
//
// SizeBefore / SizeAfter are the file sizes read via SafeGetFileSize on either side of the
// rewrite. Either can be null when the stat failed:
//   • null SizeAfter → nothing is written (we don't know the current size, so filesize
//     stays as it was and we can't compute a reliable delta).
//   • null SizeBefore with non-null SizeAfter → filesize is updated, but the quota delta
//     is skipped (adjusting the quota needs both endpoints to be trustworthy).
// A missing T_USER_STORAGE row is logged, not thrown — so a user without a quota row
// doesn't fail the whole operation. ContextLabel is only used for that log line (e.g.
// "column delete", "column rename").
export async function ApplyIngestedSizeChange(
    connection: PoolConnection,
    options: {
        DatasetId: number;
        UserId: number;
        SizeBefore: number | null;
        SizeAfter: number | null;
        ContextLabel: string;
    }
): Promise<void> {
    const { DatasetId, UserId, SizeBefore, SizeAfter, ContextLabel } = options;

    if (SizeAfter === null) {
        return;
    }

    await connection.execute(
        `UPDATE T_DATASET SET filesize = ? WHERE id = ?`,
        [SizeAfter, DatasetId]
    );

    if (SizeBefore === null || SizeBefore === SizeAfter) {
        return;
    }

    const delta = SizeAfter - SizeBefore;
    const [quotaResult] = await connection.execute<ResultSetHeader>(
        `UPDATE T_USER_STORAGE
         SET used_storage = used_storage + ?
         WHERE user_id = ?`,
        [delta, UserId]
    );

    if (quotaResult.affectedRows === 0) {
        await Logger.Info(
            `User ${UserId} has no T_USER_STORAGE row; used_storage not updated after ${ContextLabel}.`,
            UserId
        );
    }
}
