import { Request, Response } from "express";
import { UserProfileBusiness } from "../business/UserProfileBusiness";
import { SuccessDto } from "../dto/SuccessDto";
import { ErrorDto } from "../dto/ErrorDto";
import { HttpStatusCode } from "../enum/HttpStatusCode";
import { Logger } from "../log/Logger";


export class UserProfileController {
    static async GetDetails(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("UserProfile.GetDetails -> Called", req.UserData?.id);

            const userId = Number(req.UserData!.id);
            const profile = await UserProfileBusiness.DoGetUserProfile(userId);

            if (!profile) {
                res.status(HttpStatusCode.OK).json(
                    new ErrorDto(null, "User profile not found.", HttpStatusCode.NOT_FOUND)
                );
                return;
            }

            res.status(HttpStatusCode.OK).json(
                new SuccessDto(profile, "Profile retrieved successfully.", HttpStatusCode.OK)
            );
        } catch (error) {
            await Logger.Error("UserProfile.GetDetails Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred while fetching the profile.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }
}
