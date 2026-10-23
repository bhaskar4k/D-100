import path from "path";
import { Request, Response } from "express";
import { ListPython, RunPython } from "../python-manager/PythonManager";
import { ErrorDto } from "../dto/ErrorDto";
import { HttpStatusCode } from "../enum/HttpStatusCode";
import { Logger } from "../log/Logger";

// Dummy controller: exercises the pyd-100 Python package end to end so the Node <-> Python bridge
// can be checked. Remove (or replace with real business calls) once the bridge is verified.

const RAW_UPLOAD_PATH = process.env.RAW_UPLOAD_PATH;


function Query(req: Request, Name: string): string {
    return String(req.query[Name] ?? "");
}

function NumberQuery(req: Request, Name: string): number {
    return Number(req.query[Name]);
}

function Invalid(res: Response, Message: string): void {
    res.status(HttpStatusCode.OK).json(new ErrorDto(false, Message, HttpStatusCode.BAD_REQUEST));
}


export class PythonController {
    static async Functions(req: Request, res: Response): Promise<void> {
        await Logger.Info("PythonFunctions -> Called", req.UserData?.id);

        res.status(HttpStatusCode.OK).json(await ListPython());
    }

    static async Ping(req: Request, res: Response): Promise<void> {
        await Logger.Info("PythonPing -> Called", req.UserData?.id);

        res.status(HttpStatusCode.OK).json(await RunPython("ping"));
    }

    static async Echo(req: Request, res: Response): Promise<void> {
        await Logger.Info("PythonEcho -> Called", req.UserData?.id);

        res.status(HttpStatusCode.OK).json(await RunPython("echo", { text: Query(req, "text") }));
    }

    static async Add(req: Request, res: Response): Promise<void> {
        await Logger.Info("PythonAdd -> Called", req.UserData?.id);

        const a = NumberQuery(req, "a");
        const b = NumberQuery(req, "b");

        if (!Number.isFinite(a) || !Number.isFinite(b)) {
            return Invalid(res, "Query parameters 'a' and 'b' must be numbers.");
        }

        res.status(HttpStatusCode.OK).json(await RunPython("add", { a, b }));
    }

    static async Divide(req: Request, res: Response): Promise<void> {
        await Logger.Info("PythonDivide -> Called", req.UserData?.id);

        const a = NumberQuery(req, "a");
        const b = NumberQuery(req, "b");

        if (!Number.isFinite(a) || !Number.isFinite(b)) {
            return Invalid(res, "Query parameters 'a' and 'b' must be numbers.");
        }

        res.status(HttpStatusCode.OK).json(await RunPython("divide", { a, b }));
    }

    static async FileInfo(req: Request, res: Response): Promise<void> {
        await Logger.Info("PythonFileInfo -> Called", req.UserData?.id);

        const requested = Query(req, "path");

        if (!requested || !RAW_UPLOAD_PATH) {
            return Invalid(res, "Query parameter 'path' is required.");
        }

        // Only files under the RAW upload folder may be inspected.
        const root = path.resolve(RAW_UPLOAD_PATH);
        const resolved = path.resolve(root, requested);

        if (resolved !== root && !resolved.startsWith(root + path.sep)) {
            return Invalid(res, "Path must be inside the RAW upload folder.");
        }

        res.status(HttpStatusCode.OK).json(await RunPython("file_info", { path: resolved }));
    }

    // Deliberately makes the Python function raise, to check that failures come back as an ErrorDto.
    static async Crash(req: Request, res: Response): Promise<void> {
        await Logger.Info("PythonCrash -> Called", req.UserData?.id);

        res.status(HttpStatusCode.OK).json(await RunPython("crash"));
    }
}
