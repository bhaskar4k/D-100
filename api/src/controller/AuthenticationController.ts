import { Request, Response } from "express";
import { AuthenticationBusiness } from "../business/AuthenticationBusiness";
import { SuccessDto } from "../dto/SuccessDto";
import { ErrorDto } from "../dto/ErrorDto";
import { HttpStatusCode } from "../enum/HttpStatusCode";


export class AuthenticationController {
    static async Register(req: Request, res: Response): Promise<void> {
        try {
            const { name, email, phone, password } = req.body;
            const UserSaved: boolean = await AuthenticationBusiness.DoRegister(name, email, phone, password);

            res.status(HttpStatusCode.OK).json(
                new SuccessDto(
                    UserSaved,
                    "User has been registered successfully.",
                    HttpStatusCode.OK
                )
            );
        } catch (error) {
            console.error("GetMenu Error:", error);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(
                    false,
                    "An unexpected error occurred to register user.",
                    HttpStatusCode.INTERNAL_SERVER_ERROR
                )
            );
        }
    }
}