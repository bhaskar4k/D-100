import { ExecuteTMenuMasterScript } from "./TMenuMasterRunner";

export async function CreateTables(): Promise<void> {
    console.log("=====================================================");
    console.log(" Started :: Creating Tables\n");

    await ExecuteTMenuMasterScript();

    console.log("\n Finished :: Creating Tables");
    console.log("=====================================================\n");
}