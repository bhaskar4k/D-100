// Central source for Redis cache key names. Any module that reads or writes a cache entry
// should take its key from here so the key format stays in one place and typos (which would
// silently split a cache into two unreachable halves) are impossible.
export function GetMenuCacheKey(IsAuthenticated: boolean): string {
    return IsAuthenticated ? "MENU-AUTH" : "MENU-NONAUTH";
}
