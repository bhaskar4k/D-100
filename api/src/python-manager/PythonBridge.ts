import { spawn } from "child_process";

// Calls the functions of the installed pyd-100 package (see /pyd-100).
// Each call runs `python -m pyd_100 call <function>` with the arguments as JSON on stdin and
// reads one JSON document back from stdout.

const PythonExecutable = process.env.PYTHON_EXECUTABLE || "python";
const DefaultPythonTimeoutMs = Number(process.env.PYTHON_TIMEOUT_MS) || 60000;
const PythonPackage = "pyd_100";


export class PythonError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "PythonError";
    }
}


function Run(Args: string[], Input: string, TimeoutMs: number = DefaultPythonTimeoutMs): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn(PythonExecutable, ["-m", PythonPackage, ...Args], {
            stdio: ["pipe", "pipe", "pipe"],
            windowsHide: true
        });

        let stdout = "";
        let stderr = "";
        let timedOut = false;

        const timer = setTimeout(() => {
            timedOut = true;
            child.kill();
        }, TimeoutMs);

        child.stdout.setEncoding("utf8").on("data", (chunk) => (stdout += chunk));
        child.stderr.setEncoding("utf8").on("data", (chunk) => (stderr += chunk));

        child.on("error", (error) => {
            clearTimeout(timer);
            reject(new PythonError(`Could not start '${PythonExecutable}': ${error.message}`));
        });

        child.on("close", (code) => {
            clearTimeout(timer);

            if (timedOut) {
                reject(new PythonError(`Python call timed out after ${TimeoutMs} ms.`));
            } else if (!stdout.trim()) {
                reject(new PythonError(`Python exited with code ${code} and no output. ${stderr.trim()}`.trim()));
            } else {
                resolve(stdout);
            }
        });

        child.stdin.on("error", () => { /* process died early; 'close' reports it */ });
        child.stdin.end(Input);
    });
}


export interface PythonResponse<T = unknown> {
    success: boolean;
    message: string;
    data: T;
    statusCode: number;
    extraData?: any;
}


function Parse<T>(Output: string): PythonResponse<T> {
    try {
        return JSON.parse(Output) as PythonResponse<T>;
    } catch {
        throw new PythonError(`Python returned invalid JSON: ${Output.slice(0, 200)}`);
    }
}


// Call an @expose'd function of pyd-100 with keyword arguments.
// Resolves with the DTO the function produced (check `success`); it only throws PythonError when
// Python itself can't be run (not found, timeout, unreadable output). TimeoutMs overrides
// PYTHON_TIMEOUT_MS for one call (useful for long-running jobs like dataset processing).
export async function CallPython<T = unknown>(FunctionName: string, Kwargs: Record<string, unknown> = {}, TimeoutMs?: number): Promise<PythonResponse<T>> {
    return Parse<T>(await Run(["call", FunctionName], JSON.stringify(Kwargs), TimeoutMs));
}

// Names of the functions the installed pyd-100 package exposes.
export async function ListPythonFunctions(): Promise<string[]> {
    return (await Parse<string[]>(await Run(["list"], ""))).data;
}
