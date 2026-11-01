import { validate as IsValidUuid } from "uuid";
import { ConnectionPool } from "../data-access-layer/database";
import {
    MissingValueReplacementStrategyItem,
    MissingValueReplacementStrategyRow,
    HandleMissingValueRequest,
    MissingValueHandlingQueuePayload,
    DatasetUidRow,
    ColumnByIdRow,
    StrategyByIdRow
} from "../entity/DataCleaningEntity";
import { DataType, NUMERIC_TYPES, ORDERED_TYPES, ANY_SCALAR_TYPES } from "../enum/DataType";
import { MissingValueReplacementStrategy } from "../enum/MissingValueReplacementStrategyEnum";
import { DatasetProcessingStatus } from "../enum/DatasetProcessingStatus";
import { TrueFalse } from "../enum/CommonEnum";
import { GetRabbitMqChannel } from "../config/RabbitMqConfig";

const MissingValueHandlingQueue = process.env.RABBITMQ_MISSING_VALUE_HANDLING_QUEUE_NAME || "MISSING_VALUE_HANDLING";

const ALLOWED_DATATYPES_BY_STRATEGY: Record<MissingValueReplacementStrategy, DataType[]> = {
    [MissingValueReplacementStrategy.Mean]: NUMERIC_TYPES,
    [MissingValueReplacementStrategy.Median]: NUMERIC_TYPES,
    [MissingValueReplacementStrategy.Mode]: ANY_SCALAR_TYPES,
    [MissingValueReplacementStrategy.Min]: ORDERED_TYPES,
    [MissingValueReplacementStrategy.Max]: ORDERED_TYPES,
    [MissingValueReplacementStrategy.Constant]: ANY_SCALAR_TYPES,
    [MissingValueReplacementStrategy.ForwardFill]: ANY_SCALAR_TYPES,
    [MissingValueReplacementStrategy.BackwardFill]: ANY_SCALAR_TYPES,
};

export class DataCleaningBusiness {
    static async DoGetMissingValueReplacementStrategies(): Promise<MissingValueReplacementStrategyItem[]> {
        const pool = await ConnectionPool;

        const [rows] = await pool.query<MissingValueReplacementStrategyRow[]>(`
            SELECT id,
                   replacement_strategy_name,
                   replacment_strategy_enum,
                   replacment_strategy_description,
                   is_active
            FROM t_missing_value_replacement_strategy_master
            WHERE is_active = 1
            ORDER BY id ASC
        `);

        return rows.map(row => {
            const key = row.replacment_strategy_enum as MissingValueReplacementStrategy;
            return {
                id: row.id,
                replacementStrategyName: row.replacement_strategy_name,
                replacmentStrategyEnum: row.replacment_strategy_enum,
                replacmentStrategyDescription: row.replacment_strategy_description,
                isActive: row.is_active,
                allowedDatatypeToBePerformedOn: ALLOWED_DATATYPES_BY_STRATEGY[key] ?? []
            };
        });
    }

    // Validates the request, resolves the column + strategy from the DB (so the worker never
    // has to look them up), and enqueues a single message onto RabbitMQ. The dataset's
    // processing_status is left as-is here — the worker flips it to PROCESSING on pickup, per
    // the agreed hand-off contract.
    //
    // Returns an error message string when the request can't proceed; null on success.
    static async DoHandleMissingValue(UserId: number, Request: HandleMissingValueRequest): Promise<string | null> {
        const datasetUid = (Request?.datasetUid ?? "").trim();
        const columnId = Number(Request?.columnId);
        const strategyId = Number(Request?.strategyId);
        const constantValueRaw = Request?.constantValue ?? null;

        if (!datasetUid || !IsValidUuid(datasetUid)) {
            return "A valid dataset identifier is required.";
        }

        if (!Number.isFinite(columnId) || columnId <= 0) {
            return "A valid column is required.";
        }

        if (!Number.isFinite(strategyId) || strategyId <= 0) {
            return "A valid replacement strategy is required.";
        }

        const pool = await ConnectionPool;

        const [datasetRows] = await pool.query<DatasetUidRow[]>(
            `SELECT id, dataset_uid, created_by, is_processed, processing_status
             FROM T_DATASET
             WHERE dataset_uid = ? AND is_active = 1
             LIMIT 1`,
            [datasetUid]
        );

        if (datasetRows.length === 0) {
            return "Dataset not found.";
        }

        const dataset = datasetRows[0];

        if (Number(dataset.created_by) !== Number(UserId)) {
            return "You do not have access to this dataset.";
        }

        if (dataset.is_processed !== TrueFalse.True) {
            return "Dataset has not been processed yet.";
        }

        if (dataset.processing_status === DatasetProcessingStatus.IN_QUEUE
            || dataset.processing_status === DatasetProcessingStatus.PROCESSING) {
            return "Dataset is already queued or being processed.";
        }

        const [columnRows] = await pool.query<ColumnByIdRow[]>(
            `SELECT id, dataset_id, column_name, type, nullable
             FROM T_COLUMN
             WHERE id = ? AND dataset_id = ?
             LIMIT 1`,
            [columnId, dataset.id]
        );

        if (columnRows.length === 0) {
            return "Column not found for this dataset.";
        }

        const column = columnRows[0];

        if (column.nullable !== TrueFalse.True) {
            return "Column is not nullable; nothing to clean.";
        }

        const [strategyRows] = await pool.query<StrategyByIdRow[]>(
            `SELECT id, replacment_strategy_enum, is_active
             FROM t_missing_value_replacement_strategy_master
             WHERE id = ?
             LIMIT 1`,
            [strategyId]
        );

        if (strategyRows.length === 0 || strategyRows[0].is_active !== TrueFalse.True) {
            return "Replacement strategy not found or inactive.";
        }

        const strategyEnum = strategyRows[0].replacment_strategy_enum as MissingValueReplacementStrategy;
        const allowed = ALLOWED_DATATYPES_BY_STRATEGY[strategyEnum] ?? [];

        if (!allowed.includes(column.type as DataType)) {
            return "The selected strategy is not applicable to this column's data type.";
        }

        let constantValue: string | null = null;

        if (strategyEnum === MissingValueReplacementStrategy.Constant) {
            constantValue = (constantValueRaw ?? "").toString();

            if (constantValue.trim() === "") {
                return "A constant value is required for the Constant strategy.";
            }
        }

        const payload: MissingValueHandlingQueuePayload = {
            datasetId: Number(dataset.id),
            datasetUid: dataset.dataset_uid,
            columnId: Number(column.id),
            columnName: column.column_name,
            columnType: column.type,
            strategyEnum: strategyEnum,
            constantValue
        };

        const channel = GetRabbitMqChannel();
        await channel.assertQueue(MissingValueHandlingQueue, { durable: true });
        channel.sendToQueue(
            MissingValueHandlingQueue,
            Buffer.from(JSON.stringify(payload)),
            { persistent: true, contentType: "application/json" }
        );

        // The row is now in RabbitMQ; the worker flips it to PROCESSING on pickup. Clear the
        // timing fields so stale values from a previous run never show up in the UI's queued
        // state.
        await pool.execute(
            `UPDATE T_DATASET
             SET is_processed = ?,
                 processing_status = ?,
                 processing_initiated_on = NULL,
                 processing_completed_on = NULL,
                 processing_time = NULL
             WHERE id = ?`,
            [TrueFalse.False, DatasetProcessingStatus.IN_QUEUE, dataset.id]
        );

        return null;
    }
}
