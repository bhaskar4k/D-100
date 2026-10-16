import { ExecuteTMenuMasterScript } from "./TMenuMasterRunner";

export async function CreateTables(): Promise<void> {
    console.log("================================================");
    console.log("|          Started :: Creating Tables          |");
    console.log("================================================\n");
    
    await ExecuteTMenuMasterScript();

    console.log("\n================================================");
    console.log("|          Finished :: Creating Tables         |");
    console.log("================================================\n");
}