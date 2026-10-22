export function IsNullOrEmptyOrUndefined(value: any): boolean {
    return value === null || value === undefined || value.length === 0;
}


export function FormatDuration(milliseconds: number | null | undefined): string {
    if (milliseconds === null || milliseconds === undefined || isNaN(milliseconds)) {
        return '-';
    }

    const total = Math.max(0, Math.round(milliseconds));

    const hours = Math.floor(total / 3_600_000);
    const minutes = Math.floor((total % 3_600_000) / 60_000);
    const seconds = Math.floor((total % 60_000) / 1000);
    const millis = total % 1000;

    const parts: string[] = [];

    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);
    if (millis > 0 || parts.length === 0) parts.push(`${millis}ms`);

    return parts.join(' ');
}