import { Logger } from "../log/Logger";
import { WorkerJobManager } from "./WorkerJobManager";

// Register every background job the API should run here. Called once from server.ts before
// StartAll. Each Register call takes (name, intervalMs, task, runImmediately?).
export function RegisterWorkerJobs(): void {
    WorkerJobManager.Register("Heartbeat", 60_000, async () => {
        await Logger.Info("Worker heartbeat tick.");
    });
}
