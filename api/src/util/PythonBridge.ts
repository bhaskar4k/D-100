import { spawn } from "child_process";

// Calls the functions of the installed pyd-100 package (see /pyd-100).
// Each call runs `python -m pyd_100 call <function>` with the arguments as JSON on stdin and
// reads one JSON document back from stdout.

const PythonExecutable = process.env.PYTHON_EXECUTABLE || "python";
const PythonTimeoutMs = Number(process.env.PYTHON_TIMEOUT_MS) || 60000;
const PythonPackage = "pyd_100";


export class PythonError extends Error {
    constructor(message: string, readonly PythonType?: string, readonly Trace?: string) {
        super(message);
        this.name = "PythonError";
    }
}


function Run(Args: string[], Input: string): Promise<string> {
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
        }, PythonTimeoutMs);

        child.stdout.setEncoding("utf8").on("data", (chunk) => (stdout += chunk));
        child.stderr.setEncoding("utf8").on("data", (chunk) => (stderr += chunk));

        child.on("error", (error) => {
            clearTimeout(timer);
            reject(new PythonError(`Could not start '${PythonExecutable}': ${error.message}`));
        });

        child.on("close", (code) => {
            clearTimeout(timer);

            if (timedOut) {
                reject(new PythonError(`Python call timed out after ${PythonTimeoutMs} ms.`));
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


function Parse<T>(Output: string): T {
    let response: { ok: boolean; result?: T; error?: string; type?: string; trace?: string };

    try {
        response = JSON.parse(Output);
    } catch {
        throw new PythonError(`Python returned invalid JSON: ${Output.slice(0, 200)}`);
    }

    if (!response.ok) {
        throw new PythonError(response.error ?? "Unknown Python error.", response.type, response.trace);
    }

    return response.result as T;
}


// Call an @expose'd function of pyd-100 with keyword arguments; resolves with its JSON result.
export async function CallPython<T = unknown>(FunctionName: string, Kwargs: Record<string, unknown> = {}): Promise<T> {
    return Parse<T>(await Run(["call", FunctionName], JSON.stringify(Kwargs)));
}

// Names of the functions the installed pyd-100 package exposes.
export async function ListPythonFunctions(): Promise<string[]> {
    return Parse<string[]>(await Run(["list"], ""));
}
