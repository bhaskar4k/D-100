import { Request, Response } from "express";
import { UserStorageBusiness } from "../business/UserStorageBusiness";
import { SuccessDto } from "../dto/SuccessDto";
import { ErrorDto } from "../dto/ErrorDto";
import { HttpStatusCode } from "../enum/HttpStatusCode";
import { Logger } from "../log/Logger";


export class UserStorageController {
    static async GetDetails(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("UserStorage.GetDetails -> Called", req.UserData?.id);

            const userId = Number(req.UserData!.id);
            const details = await UserStorageBusiness.DoGetUserStorageDetails(userId);

            if (!details) {
                res.status(HttpStatusCode.OK).json(
                    new ErrorDto(null, "Storage quota not configured for this user.", HttpStatusCode.NOT_FOUND)
                );
                return;
            }

            res.status(HttpStatusCode.OK).json(
                new SuccessDto(details, "Storage details retrieved successfully.", HttpStatusCode.OK)
            );
        } catch (error) {
            await Logger.Error("UserStorage.GetDetails Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred while fetching storage details.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }
}
