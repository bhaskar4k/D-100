import { Request, Response } from "express";
import { UserBusiness } from "../business/CommonBusiness";
import { SuccessDto } from "../dto/SuccessDto";
import { ErrorDto } from "../dto/ErrorDto";
import { HttpStatusCode } from "../enum/HttpStatusCode";
import { Logger } from "../log/Logger";
import { MenuItem } from "../entity/CommonEntity";


export class CommonController {
    static async GetMenu(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("GetMenu -> Called", req.UserData?.id);

            const menu: MenuItem[] = await UserBusiness.DoGetMenu(req.UserData!);

            res.status(HttpStatusCode.OK).json(new SuccessDto(menu, "Menu retrieved successfully.", HttpStatusCode.OK));
        } catch (error) {
            await Logger.Error("GetMenu Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred to get menu.", HttpStatusCode.INTERNAL_SERVER_ERROR
                )
            );
        }
    }
}