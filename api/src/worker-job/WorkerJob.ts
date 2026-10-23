import { Logger } from "../log/Logger";

export type WorkerJobTask = () => void | Promise<void>;

// A single background job: runs Task on a fixed interval. Overlapping ticks are suppressed so a
// slow run cannot pile up behind the next schedule, and errors in Task are logged (never thrown)
// so the loop keeps going.
export class WorkerJob {
    private Timer: NodeJS.Timeout | null = null;
    private Running = false;
    private InFlight = false;

    constructor(
        private readonly Name: string,
        private readonly IntervalMs: number,
        private readonly Task: WorkerJobTask,
        // runImmediately: fire once at startup, before the first interval wait.
        private readonly RunImmediately: boolean = false
    ) {}

    GetName(): string {
        return this.Name;
    }

    IsRunning(): boolean {
        return this.Running;
    }

    Start(): void {
        if (this.Running) return;
        this.Running = true;

        void Logger.Info(`Worker job '${this.Name}' started (interval ${this.IntervalMs}ms).`);

        if (this.RunImmediately) {
            void this.Tick();
        }

        this.Timer = setInterval(() => void this.Tick(), this.IntervalMs);
    }

    async Stop(): Promise<void> {
        if (!this.Running) return;
        this.Running = false;

        if (this.Timer !== null) {
            clearInterval(this.Timer);
            this.Timer = null;
        }

        // Wait briefly for an in-flight tick so Stop returns only once the job is idle.
        const DeadlineMs = Date.now() + 5000;
        while (this.InFlight && Date.now() < DeadlineMs) {
            await new Promise((Resolve) => setTimeout(Resolve, 50));
        }

        void Logger.Info(`Worker job '${this.Name}' stopped.`);
    }

    private async Tick(): Promise<void> {
        if (this.InFlight) return;
        this.InFlight = true;

        try {
            await this.Task();
        } catch (error) {
            await Logger.Error(`Worker job '${this.Name}' tick failed.`, error);
        } finally {
            this.InFlight = false;
        }
    }
}
