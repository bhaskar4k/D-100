import { SeedTMenuMaster } from "./TMenuMasterSeeder";
import { SeedDefaultUserIntoTUserMaster } from "./TUserMasterDefaultUserSeeder";
import { SeedTMissingValueReplacementStrategy } from "./TMissingValueReplacementStrategySeeder";

export async function SeedTables(): Promise<void> {
    console.log("=====================================================");
    console.log(" Started :: Seeding Tables\n");

    await SeedTMenuMaster();
    await SeedDefaultUserIntoTUserMaster();
    await SeedTMissingValueReplacementStrategy();

    console.log("\n Finished :: Seeding Tables");
    console.log("=====================================================\n");
}