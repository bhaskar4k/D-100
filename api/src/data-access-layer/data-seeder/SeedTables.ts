import { SeedTMenuMaster } from "./TMenuMasterSeeder";

export async function SeedTables(): Promise<void> {
    console.log("=====================================================");
    console.log(" Started :: Seeding Tables\n");

    await SeedTMenuMaster();

    console.log("\n Finished :: Seeding Tables");
    console.log("=====================================================\n");
}