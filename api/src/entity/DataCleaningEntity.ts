import { RowDataPacket } from "mysql2";
import { DataType } from "../enum/DataType";

export interface MissingValueReplacementStrategyItem {
    id: number;
    replacementStrategyName: string;
    replacmentStrategyEnum: string;
    replacmentStrategyDescription: string;
    isActive: number;
    allowedDatatypeToBePerformedOn: DataType[];
}

export interface MissingValueReplacementStrategyRow extends RowDataPacket {
    id: number;
    replacement_strategy_name: string;
    replacment_strategy_enum: string;
    replacment_strategy_description: string;
    is_active: number;
}
