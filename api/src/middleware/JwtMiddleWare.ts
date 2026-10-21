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

export async function JwtMiddleWare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const header = req.headers.authorization;
        const SessionUuid = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";

        if (!SessionUuid || !IsValidUuid(SessionUuid) || UuidVersion(SessionUuid) !== 7) {
            Unauthorized(res, "Invalid session.");
            return;
        }

        const redis = await RedisConnection;
        const JwtToken = await redis.get(GetSessionKey(SessionUuid));

        if (!JwtToken) {
            Unauthorized(res, "Session expired or not found.");
            return;
        }

        let payload: jwt.JwtPayload;
        try {
            payload = jwt.verify(JwtToken, JwtSecret) as jwt.JwtPayload;
        } catch {
            Unauthorized(res, "Invalid or expired token.");
            return;
        }

        req.UserData = {
            id: payload.id,
        };

        next();
    } catch (error) {
        console.error("JwtMiddleWare Error:", error);

        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
            new ErrorDto(false, "An unexpected error occurred while validating session.", HttpStatusCode.INTERNAL_SERVER_ERROR)
        );
    }
}

export default JwtMiddleWare;
