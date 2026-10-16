import { ExecuteTMenuMasterScript } from "./TMenuMasterRunner";
import { ExecuteTUserMasterScript } from "./TUserMasterRunner";

export async function CreateTables(): Promise<void> {
    console.log("=====================================================");
    console.log(" Started :: Creating Tables\n");

    await ExecuteTMenuMasterScript();
    await ExecuteTUserMasterScript()

    console.log("\n Finished :: Creating Tables");
    console.log("=====================================================\n");
}