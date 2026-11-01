import { ConnectionPool } from "../../data-access-layer/database";
import { MissingValueReplacementStrategy } from "../../enum/MissingValueReplacementStrategyEnum";

interface MissingValueReplacementStrategySeed {
    replacement_strategy_name: string;
    replacment_strategy_enum: MissingValueReplacementStrategy;
    replacment_strategy_description: string;
    is_active: number;
}

const strategies: MissingValueReplacementStrategySeed[] = [
    {
        replacement_strategy_name: "Mean imputation",
        replacment_strategy_enum: MissingValueReplacementStrategy.Mean,
        replacment_strategy_description:
            "Replaces every null in the column with the arithmetic mean of its non-null values. Works on numeric columns only.",
        is_active: 1
    },
    {
        replacement_strategy_name: "Median imputation",
        replacment_strategy_enum: MissingValueReplacementStrategy.Median,
        replacment_strategy_description:
            "Replaces every null in the column with the median of its non-null values. Robust to outliers; numeric columns only.",
        is_active: 1
    },
    {
        replacement_strategy_name: "Mode imputation",
        replacment_strategy_enum: MissingValueReplacementStrategy.Mode,
        replacment_strategy_description:
            "Replaces every null in the column with the most frequent non-null value. Suitable for categorical and numeric columns.",
        is_active: 1
    },
    {
        replacement_strategy_name: "Minimum-value imputation",
        replacment_strategy_enum: MissingValueReplacementStrategy.Min,
        replacment_strategy_description:
            "Replaces every null in the column with its smallest non-null value. Numeric or date-like columns only.",
        is_active: 1
    },
    {
        replacement_strategy_name: "Maximum-value imputation",
        replacment_strategy_enum: MissingValueReplacementStrategy.Max,
        replacment_strategy_description:
            "Replaces every null in the column with its largest non-null value. Numeric or date-like columns only.",
        is_active: 1
    },
    {
        replacement_strategy_name: "Constant-value imputation",
        replacment_strategy_enum: MissingValueReplacementStrategy.Constant,
        replacment_strategy_description:
            "Replaces every null in the column with a fixed value you provide. The value must match the column's data type.",
        is_active: 1
    },
    {
        replacement_strategy_name: "Forward fill",
        replacment_strategy_enum: MissingValueReplacementStrategy.ForwardFill,
        replacment_strategy_description:
            "Propagates the previous non-null value forward over nulls. Row order matters; leading nulls are left unchanged.",
        is_active: 1
    },
    {
        replacement_strategy_name: "Backward fill",
        replacment_strategy_enum: MissingValueReplacementStrategy.BackwardFill,
        replacment_strategy_description:
            "Propagates the next non-null value backward over nulls. Row order matters; trailing nulls are left unchanged.",
        is_active: 1
    }
];

export async function SeedTMissingValueReplacementStrategy(): Promise<void> {
    const pool = await ConnectionPool;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        for (const item of strategies) {
            const [existing] = await connection.execute<any[]>(
                `SELECT ID
                 FROM T_MISSING_VALUE_REPLACEMENT_STRATEGY_MASTER
                 WHERE REPLACMENT_STRATEGY_ENUM = ?
                 LIMIT 1`,
                [item.replacment_strategy_enum]
            );

            if (existing.length > 0) {
                await connection.execute(
                    `UPDATE T_MISSING_VALUE_REPLACEMENT_STRATEGY_MASTER
                     SET REPLACEMENT_STRATEGY_NAME = ?,
                         REPLACMENT_STRATEGY_DESCRIPTION = ?,
                         IS_ACTIVE = ?
                     WHERE ID = ?`,
                    [
                        item.replacement_strategy_name,
                        item.replacment_strategy_description,
                        item.is_active,
                        existing[0].ID
                    ]
                );
            } else {
                await connection.execute(
                    `INSERT INTO T_MISSING_VALUE_REPLACEMENT_STRATEGY_MASTER
                        (REPLACEMENT_STRATEGY_NAME, REPLACMENT_STRATEGY_ENUM, REPLACMENT_STRATEGY_DESCRIPTION, IS_ACTIVE)
                     VALUES (?, ?, ?, ?)`,
                    [
                        item.replacement_strategy_name,
                        item.replacment_strategy_enum,
                        item.replacment_strategy_description,
                        item.is_active
                    ]
                );
            }
        }

        await connection.commit();

        console.log("✅ T_MISSING_VALUE_REPLACEMENT_STRATEGY Seeded Successfully.");
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
