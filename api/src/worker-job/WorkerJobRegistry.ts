import { Logger } from "../log/Logger";
import { WorkerJobManager } from "./WorkerJobManager";
import { DatasetProcessingTick } from "./jobs/DatasetProcessingJob";

// Register every background job the API should run here. Called once from server.ts before
// StartAll. Each Register call takes (name, intervalMs, task, runImmediately?).
export function RegisterWorkerJobs(): void {
    console.log("=====================================================");
    console.log(" Started :: Registering Worker Jobs\n");

    WorkerJobManager.Register("Heartbeat", 60_000, async () => {});
    console.log("✅ Heartbeat Job Registered Successfully.");

    WorkerJobManager.Register("DatasetProcessing", 60_000, DatasetProcessingTick, true);
    console.log("✅ DatasetProcessing Job Registered Successfully.");

    console.log("\n Finished :: Registering Worker Jobs");
    console.log("=====================================================\n");
}
