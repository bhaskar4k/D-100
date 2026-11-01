import { ConnectionPool } from "../data-access-layer/database";
import {
    MissingValueReplacementStrategyItem,
    MissingValueReplacementStrategyRow
} from "../entity/DataCleaningEntity";

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

        return rows.map(row => ({
            id: row.id,
            replacementStrategyName: row.replacement_strategy_name,
            replacmentStrategyEnum: row.replacment_strategy_enum,
            replacmentStrategyDescription: row.replacment_strategy_description,
            isActive: row.is_active
        }));
    }
}
