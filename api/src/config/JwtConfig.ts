const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured in .env");
}

export const JwtSecret: string = JWT_SECRET;
export const JwtExpiresInSeconds: number = Number(process.env.JWT_EXPIRES_IN_SECONDS) || 86400;
