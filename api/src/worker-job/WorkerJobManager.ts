import { Logger } from "../log/Logger";
import { WorkerJob, WorkerJobTask } from "./WorkerJob";

// Owns every background WorkerJob the API runs. Register jobs here, then StartAll on server
// startup and StopAll on shutdown. ShutdownHooks are installed once so SIGINT/SIGTERM and
// uncaught crashes stop every job cleanly instead of leaving timers behind.
export class WorkerJobManager {
    private static readonly Jobs: WorkerJob[] = [];
    private static HooksInstalled = false;
    private static ShuttingDown = false;

    static Register(Name: string, IntervalMs: number, Task: WorkerJobTask, RunImmediately: boolean = false): WorkerJob {
        const Job = new WorkerJob(Name, IntervalMs, Task, RunImmediately);
        WorkerJobManager.Jobs.push(Job);
        return Job;
    }

    static async StartAll(): Promise<void> {
        WorkerJobManager.InstallShutdownHooks();

        for (const Job of WorkerJobManager.Jobs) {
            Job.Start();
        }

        void Logger.Info(`WorkerJobManager started ${WorkerJobManager.Jobs.length} job(s).`);

        console.log("✅ Worker Job Started Successfully.");
    }

    static async StopAll(): Promise<void> {
        if (WorkerJobManager.ShuttingDown) return;
        WorkerJobManager.ShuttingDown = true;

        await Promise.all(WorkerJobManager.Jobs.map((Job) => Job.Stop()));

        void Logger.Info("WorkerJobManager stopped all jobs.");
    }

    private static InstallShutdownHooks(): void {
        if (WorkerJobManager.HooksInstalled) return;
        WorkerJobManager.HooksInstalled = true;

        const Shutdown = async (Signal: string): Promise<void> => {
            console.log(`\n⏹  Received ${Signal}, stopping worker jobs...`);
            await WorkerJobManager.StopAll();
            process.exit(0);
        };

        process.on("SIGINT", () => void Shutdown("SIGINT"));
        process.on("SIGTERM", () => void Shutdown("SIGTERM"));
    }
}
