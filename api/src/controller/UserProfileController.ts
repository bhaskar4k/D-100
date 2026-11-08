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


    static async ChangePassword(req: Request, res: Response): Promise<void> {
        try {
            // Don't echo the body — it carries the password. Only the user id goes in the log.
            await Logger.Info("UserProfile.ChangePassword -> Called", req.UserData?.id);

            const userId = Number(req.UserData!.id);
            const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
            const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

            const error = await UserProfileBusiness.DoChangePassword(userId, currentPassword, newPassword);

            if (error !== null) {
                res.status(HttpStatusCode.OK).json(
                    new ErrorDto(null, error, HttpStatusCode.BAD_REQUEST)
                );
                return;
            }

            res.status(HttpStatusCode.OK).json(
                new SuccessDto(null, "Password has been successfully updated.", HttpStatusCode.OK)
            );
        } catch (error) {
            await Logger.Error("UserProfile.ChangePassword Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred while updating the password.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }
}
