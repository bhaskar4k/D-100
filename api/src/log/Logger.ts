import { ConnectionPool } from "../data-access-layer/database";
import { LogType } from "../enum/LogType";

const MaxMessageLength = 10000;


function NormalizeUserId(UserId?: number | string | null): number | null {
    const id = Number(UserId);
    // User ids are positive; 0 is the guest placeholder used by the optional-auth middleware.
    return UserId !== null && UserId !== undefined && Number.isFinite(id) && id > 0 ? id : null;
}

function DescribeError(Error_: unknown): string {
    if (Error_ instanceof Error) {
        return Error_.stack ?? `${Error_.name}: ${Error_.message}`;
    }

    return String(Error_);
}


// Writes to T_LOG and mirrors to the console. Logging must never break a request, so every
// method swallows its own failures (falling back to the console) and is safe to call without await.
export class Logger {
    static async Info(Message: string, CreatedBy?: number | string | null): Promise<void> {
        // console.log(`[INFO] ${Message}`);
        await Logger.Write(LogType.Info, Message, CreatedBy);
    }

    static async Error(Message: string, Error_?: unknown, CreatedBy?: number | string | null): Promise<void> {
        const full = Error_ === undefined ? Message : `${Message}\n${DescribeError(Error_)}`;

        // console.error(`[ERROR] ${full}`);
        await Logger.Write(LogType.Error, full, CreatedBy);
    }

    private static async Write(Type: LogType, Message: string, CreatedBy?: number | string | null): Promise<void> {
        try {
            const pool = await ConnectionPool;

            await pool.execute(
                `INSERT INTO T_LOG (log_type, log_message, created_by) VALUES (?, ?, ?)`,
                [Type, Message.slice(0, MaxMessageLength), NormalizeUserId(CreatedBy)]
            );
        } catch (error) {
            console.error("[LOGGER] Failed to write log to database:", error);
        }
    }
}
