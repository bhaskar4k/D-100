import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { validate as IsValidUuid, version as UuidVersion } from "uuid";
import { RedisConnection } from "../config/RedisConfig";
import { JwtSecret } from "../config/JwtConfig";
import { UserData } from "../entity/AuthenticationEntity";
import { HttpStatusCode } from "../enum/HttpStatusCode";
import { ErrorDto } from "../dto/ErrorDto";
import { GetSessionKey } from "../util/AuthUtil";

declare global {
    namespace Express {
        interface Request {
            UserData?: UserData;
        }
    }
}

function Unauthorized(res: Response, message: string): void {
    res.status(HttpStatusCode.UNAUTHORIZED).json(new ErrorDto(false, message, HttpStatusCode.UNAUTHORIZED));
}

const GuestUser: UserData = { auth: false, id: 0 };

type ResolveResult = { user: UserData } | { error: string };

async function ResolveUser(req: Request): Promise<ResolveResult> {
    const header = req.headers.authorization;
    const SessionUuid = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";

    if (!SessionUuid || !IsValidUuid(SessionUuid) || UuidVersion(SessionUuid) !== 7) {
        return { error: "Invalid session." };
    }

    const redis = await RedisConnection;
    const JwtToken = await redis.get(GetSessionKey(SessionUuid));

    if (!JwtToken) {
        return { error: "Session expired or not found." };
    }

    let payload: jwt.JwtPayload;
    try {
        payload = jwt.verify(JwtToken, JwtSecret) as jwt.JwtPayload;
    } catch {
        return { error: "Invalid or expired token." };
    }

    return {
        user: {
            auth: true,
            id: payload.id
        }
    };
}

function ServerError(res: Response, error: unknown): void {
    console.error("JwtMiddleWare Error:", error);

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        new ErrorDto(false, "An unexpected error occurred while validating session.", HttpStatusCode.INTERNAL_SERVER_ERROR)
    );
}


// Rejects the request with 401 unless it carries a valid session.
export async function JwtMiddleWare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const result = await ResolveUser(req);

        if ("error" in result) {
            Unauthorized(res, result.error);
            return;
        }

        req.UserData = result.user;
        next();
    } catch (error) {
        ServerError(res, error);
    }
}


// Lets the request through either way; req.UserData.auth tells whether the session was valid.
export async function OptionalJwtMiddleWare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const result = await ResolveUser(req);

        req.UserData = "user" in result ? result.user : GuestUser;
        next();
    } catch (error) {
        ServerError(res, error);
    }
}

export default JwtMiddleWare;
