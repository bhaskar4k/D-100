import path from "path";
import { Request, Response } from "express";
import { CallPython, ListPythonFunctions, PythonError, PythonResponse } from "../python-manager/PythonBridge";
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

// Python already answers in the API's DTO shape, so it is passed straight through.
async function Respond(req: Request, res: Response, Label: string, Call: () => Promise<PythonResponse>): Promise<void> {
    try {
        await Logger.Info(`${Label} -> Called`, req.UserData?.id);

        res.status(HttpStatusCode.OK).json(await Call());
    } catch (error) {
        await Logger.Error(`${Label} Error`, error, req.UserData?.id);

        const message = error instanceof PythonError ? error.message : "An unexpected error occurred while calling Python.";

        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
            new ErrorDto(null, message, HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}

function Invalid(res: Response, Message: string): void {
    res.status(HttpStatusCode.OK).json(new ErrorDto(false, Message, HttpStatusCode.BAD_REQUEST));
}


export class PythonController {
    static async Functions(req: Request, res: Response): Promise<void> {
        await Respond(req, res, "PythonFunctions", async () => ({
            success: true,
            message: "OK",
            data: await ListPythonFunctions(),
            statusCode: HttpStatusCode.OK
        }));
    }

    static async Ping(req: Request, res: Response): Promise<void> {
        await Respond(req, res, "PythonPing", () => CallPython("ping"));
    }

    static async Echo(req: Request, res: Response): Promise<void> {
        await Respond(req, res, "PythonEcho", () => CallPython("echo", { text: Query(req, "text") }));
    }

    static async Add(req: Request, res: Response): Promise<void> {
        const a = NumberQuery(req, "a");
        const b = NumberQuery(req, "b");

        if (!Number.isFinite(a) || !Number.isFinite(b)) {
            return Invalid(res, "Query parameters 'a' and 'b' must be numbers.");
        }

        await Respond(req, res, "PythonAdd", () => CallPython("add", { a, b }));
    }

    static async Divide(req: Request, res: Response): Promise<void> {
        const a = NumberQuery(req, "a");
        const b = NumberQuery(req, "b");

        if (!Number.isFinite(a) || !Number.isFinite(b)) {
            return Invalid(res, "Query parameters 'a' and 'b' must be numbers.");
        }

        await Respond(req, res, "PythonDivide", () => CallPython("divide", { a, b }));
    }

    static async FileInfo(req: Request, res: Response): Promise<void> {
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

        await Respond(req, res, "PythonFileInfo", () => CallPython("file_info", { path: resolved }));
    }

    // Deliberately makes the Python function raise, to check that failures come back as an ErrorDto.
    static async Crash(req: Request, res: Response): Promise<void> {
        await Respond(req, res, "PythonCrash", () => CallPython("crash"));
    }
}
