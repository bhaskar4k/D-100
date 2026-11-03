import { TrueFalse } from "../../enum/CommonEnum";
import { ColumnStateSnapshot } from "../../entity/audit/MissingValueHandlingEntity";


export function BuildColumnStateFromRow(row: {
    type: number;
    nullable: number;
    unique_count: number | bigint;
    null_value_count: number | bigint;
}): ColumnStateSnapshot {
    return {
        datatype: Number(row.type),
        nullable: Number(row.nullable) === TrueFalse.True,
        unique_count: Number(row.unique_count),
        null_value_count: Number(row.null_value_count),
    };
}


export function BuildColumnStateFromMetadata(
    datatype: number,
    nullable: boolean,
    uniqueCount: number,
    nullValueCount: number
): ColumnStateSnapshot {
    return {
        datatype,
        nullable,
        unique_count: uniqueCount,
        null_value_count: nullValueCount,
    };
}
