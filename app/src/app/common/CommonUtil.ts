export function IsNullOrEmptyOrUndefined(value: any): boolean {
    return value === null || value === undefined || value.length === 0;
}