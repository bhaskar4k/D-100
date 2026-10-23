import path from "path";
import { Request, Response } from "express";
import { ListPython, RunPython } from "../python-manager/PythonManager";
import { ErrorDto } from "../dto/ErrorDto";
import { HttpStatusCode } from "../enum/HttpStatusCode";
import { Logger } from "../log/Logger";


// Dummy controller
export class PythonController {
    static async Functions(req: Request, res: Response): Promise<void> {
        await Logger.Info("PythonFunctions -> Called", req.UserData?.id);

        const PythonOutput = await ListPython();

        res.status(HttpStatusCode.OK).json(PythonOutput);
    }

    static async Ping(req: Request, res: Response): Promise<void> {
        await Logger.Info("PythonPing -> Called", req.UserData?.id);

        const PythonOutput = await RunPython("ping");
        console.log("PythonPing -> Output:", PythonOutput);

        res.status(HttpStatusCode.OK).json(PythonOutput);
    }

    static async Echo(req: Request, res: Response): Promise<void> {
        await Logger.Info("PythonEcho -> Called", req.UserData?.id);
        
        const text = String(req.query["text"]) ?? "";
        
        const PythonOutput = await RunPython("echo", { text });
        console.log("PythonEcho -> Output:", PythonOutput);

        res.status(HttpStatusCode.OK).json(PythonOutput);
    }

    static async Add(req: Request, res: Response): Promise<void> {
        await Logger.Info("PythonAdd -> Called", req.UserData?.id);

        const a = Number(String(req.query["a"]));
        const b = Number(String(req.query["b"]));

        const PythonOutput = await RunPython("add", { a, b });
        console.log("PythonAdd -> Output:", PythonOutput);

        res.status(HttpStatusCode.OK).json(PythonOutput);
    }

    static async Divide(req: Request, res: Response): Promise<void> {
        await Logger.Info("PythonDivide -> Called", req.UserData?.id);

        const a = Number(String(req.query["a"]));
        const b = Number(String(req.query["b"]));

        const PythonOutput = await RunPython("divide", { a, b });
        console.log("PythonDivide -> Output:", PythonOutput);

        res.status(HttpStatusCode.OK).json(PythonOutput);
    }
}
