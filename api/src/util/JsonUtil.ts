import { Logger } from "../log/Logger";

export function SafeJsonParse<T = unknown>(value: string): T | null {
    try {
        return JSON.parse(value) as T;
    } catch (error) {
        // A corrupt row should not break the whole page; log it and surface a null so the UI
        // renders "no data" for just this cell.
        void Logger.Error(`Failed to parse JSON: '${value}'`, error);
        return null;
    }
}