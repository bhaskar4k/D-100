import { TrueFalse } from "../../enum/CommonEnum";
import { MissingValueHandlingStateEntity } from "../../entity/audit/MissingValueHandlingEntity";


export function BuildColumnStateFromRow(
    row: {
        type: number;
        nullable: number;
        unique_count: number | bigint;
        null_value_count: number | bigint;
    },
    replacementStrategy: string
): MissingValueHandlingStateEntity {
    return {
        datatype: Number(row.type),
        nullable: Number(row.nullable) === TrueFalse.True,
        unique_count: Number(row.unique_count),
        null_value_count: Number(row.null_value_count),
        replacement_strategy: replacementStrategy,
    };
}


export function BuildColumnStateFromMetadata(
    datatype: number,
    nullable: boolean,
    uniqueCount: number,
    nullValueCount: number,
    replacementStrategy: string
): MissingValueHandlingStateEntity {
    return {
        datatype,
        nullable,
        unique_count: uniqueCount,
        null_value_count: nullValueCount,
        replacement_strategy: replacementStrategy,
    };
}
