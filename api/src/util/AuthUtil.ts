export function GetSessionKey(SessionId: string): string {
    return `${process.env.JWT_SESSION_KEY_PREFIX}-${SessionId}`;
}