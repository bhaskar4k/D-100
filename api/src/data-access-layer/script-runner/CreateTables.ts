import { ExecuteTMenuMasterScript } from "./TMenuMasterRunner";
import { ExecuteTUserMasterScript } from "./TUserMasterRunner";
import { ExecuteTDatasetScript } from "./TDatasetRunner";
import { ExecuteTLogScript } from "./TLogRunner";

export async function CreateTables(): Promise<void> {
    console.log("=====================================================");
    console.log(" Started :: Creating Tables\n");

    await ExecuteTMenuMasterScript();
    await ExecuteTUserMasterScript();
    await ExecuteTDatasetScript();
    await ExecuteTLogScript();

    console.log("\n Finished :: Creating Tables");
    console.log("=====================================================\n");
}