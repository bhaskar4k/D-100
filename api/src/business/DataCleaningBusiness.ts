import { ConnectionPool } from "../data-access-layer/database";
import {
    MissingValueReplacementStrategyItem,
    MissingValueReplacementStrategyRow
} from "../entity/DataCleaningEntity";
import { DataType, NUMERIC_TYPES, ORDERED_TYPES, ANY_SCALAR_TYPES } from "../enum/DataType";
import { MissingValueReplacementStrategy } from "../enum/MissingValueReplacementStrategyEnum";

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
}
