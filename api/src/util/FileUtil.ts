import fs from "fs/promises";
import { Logger } from "../log/Logger";


// Best-effort file-size read. Returns the size in bytes on success, or null when the file
// cannot be stat'd (missing, permissions quirk, race between write and read). On failure it
// logs with the caller-supplied context so the reason for the null is traceable without the
// caller having to wrap each call in its own try/catch.
//
// Use this for side-effect reads where a missing size should be tolerated (e.g. a quota
// bump that falls back to "skip"). Do NOT use it when the size is load-bearing — if the
// upstream code must fail when the file is missing (an integrity check, for example),
// call fs.stat directly so the exception can propagate.
export async function SafeGetFileSize(FilePath: string, Context: string = ""): Promise<number | null> {
    try {
        const stat = await fs.stat(FilePath);
        return stat.size;
    } catch (error) {
        const prefix = Context ? `${Context}: ` : "";
        await Logger.Error(`${prefix}could not stat file at ${FilePath}.`, error);
        return null;
    }
}
