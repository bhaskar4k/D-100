import { Request, Response } from "express";
import { UserBusiness } from "../business/CommonBusiness";
import { SuccessDto } from "../dto/SuccessDto";
import { ErrorDto } from "../dto/ErrorDto";
import { HttpStatusCode } from "../enum/HttpStatusCode";
import { MenuItem } from "../entity/CommonEntity";


export class CommonController {
    static async GetMenu(req: Request, res: Response): Promise<void> {
        try {
            const menu: MenuItem[] = await UserBusiness.DoGetMenu(req.UserData!);

            res.status(HttpStatusCode.OK).json(new SuccessDto(menu, "Menu retrieved successfully.", HttpStatusCode.OK));
        } catch (error) {
            console.error("GetMenu Error:", error);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred to get menu.", HttpStatusCode.INTERNAL_SERVER_ERROR
                )
            );
        }
    }
}