import { RowDataPacket } from "mysql2";

export interface MissingValueReplacementStrategyItem {
    id: number;
    replacementStrategyName: string;
    replacmentStrategyEnum: string;
    replacmentStrategyDescription: string;
    isActive: number;
}

export interface MissingValueReplacementStrategyRow extends RowDataPacket {
    id: number;
    replacement_strategy_name: string;
    replacment_strategy_enum: string;
    replacment_strategy_description: string;
    is_active: number;
}
