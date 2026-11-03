import { ExecuteTMenuMasterScript } from "./TMenuMasterRunner";
import { ExecuteTUserMasterScript } from "./TUserMasterRunner";
import { ExecuteTDatasetScript } from "./TDatasetRunner";
import { ExecuteTColumnScript } from "./TColumnRunner";
import { ExecuteTDeletedDatasetScript } from "./TDeletedDatasetRunner";
import { ExecuteTLogScript } from "./TLogRunner";
import { ExecuteTMissingValueReplacementStrategyScript } from "./TMissingValueReplacementStrategyRunner";
import { ExecuteTDatasetHistoryScript } from "./TDatasetHistoryRunner";

export async function CreateTables(): Promise<void> {
    console.log("=====================================================");
    console.log(" Started :: Creating Tables\n");

    await ExecuteTMenuMasterScript();
    await ExecuteTUserMasterScript();
    await ExecuteTDatasetScript();
    await ExecuteTColumnScript();
    await ExecuteTDeletedDatasetScript();
    await ExecuteTLogScript();
    await ExecuteTMissingValueReplacementStrategyScript();
    await ExecuteTDatasetHistoryScript();

    console.log("\n Finished :: Creating Tables");
    console.log("=====================================================\n");
}