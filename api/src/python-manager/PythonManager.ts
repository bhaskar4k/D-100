import { CallPython, ListPythonFunctions, PythonError, PythonResponse } from "./PythonBridge";
import { ErrorDto } from "../dto/ErrorDto";
import { HttpStatusCode } from "../enum/HttpStatusCode";
import { Logger } from "../log/Logger";

// Common entry point for calling the pyd-100 Python package from anywhere in the API (business,
// controllers, ...). It knows nothing about requests or responses: it calls Python and returns
// Python's own output (a SuccessDto/ErrorDto-shaped response) straight away. If Python can't be run
// at all, the failure is logged and an ErrorDto-shaped response is returned instead of throwing.

async function Safe<T>(Description: string, Call: () => Promise<PythonResponse<T>>): Promise<PythonResponse<T>> {
    try {
        return await Call();
    } catch (error) {
        await Logger.Error(`Python Error: ${Description}`, error);

        const message = error instanceof PythonError ? error.message : "An unexpected error occurred while calling Python.";

        return new ErrorDto(null, message, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
}


// Calls an @expose'd pyd-100 function with keyword arguments.
export function RunPython<T = unknown>(FunctionName: string, Kwargs: Record<string, unknown> = {}): Promise<PythonResponse<T>> {
    return Safe(`call '${FunctionName}'`, () => CallPython<T>(FunctionName, Kwargs));
}

// Lists the functions pyd-100 exposes.
export function ListPython(): Promise<PythonResponse<string[]>> {
    return Safe("list functions", async () => ({
        success: true,
        message: "OK",
        data: await ListPythonFunctions(),
        statusCode: HttpStatusCode.OK
    }));
}
