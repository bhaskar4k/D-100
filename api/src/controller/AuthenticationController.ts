import { Request, Response } from "express";
import { AuthenticationBusiness } from "../business/AuthenticationBusiness";
import { SuccessDto } from "../dto/SuccessDto";
import { ErrorDto } from "../dto/ErrorDto";
import { HttpStatusCode } from "../enum/HttpStatusCode";


export class AuthenticationController {
    static async Register(req: Request, res: Response): Promise<void> {
        try {
            const { name, email, phone, password } = req.body;

            if (!name) {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, "Name is required.", HttpStatusCode.BAD_REQUEST));
                return;
            }

            if (!email) {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, "Email is required.", HttpStatusCode.BAD_REQUEST));
                return;
            }

            if (!phone) {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, "Phone is required.", HttpStatusCode.BAD_REQUEST));
                return;
            }

            if (!password) {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, "Password is required.", HttpStatusCode.BAD_REQUEST));
                return;
            }

            const normalizedName = name.trim();
            const normalizedEmail = email.trim().toLowerCase();
            const normalizedPhone = phone.trim();

            // Check for duplication.
            if (await AuthenticationBusiness.IsEmailRegistered(normalizedEmail)) {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, "Email is already registered.", HttpStatusCode.BAD_REQUEST));
                return;
            }

            if (await AuthenticationBusiness.IsPhoneRegistered(normalizedPhone)) {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, "Phone is already registered.", HttpStatusCode.BAD_REQUEST));
                return;
            }

            const UserSaved: boolean = await AuthenticationBusiness.DoRegister(normalizedName, normalizedEmail, normalizedPhone, password);

            res.status(HttpStatusCode.OK).json(
                new SuccessDto(UserSaved, "User has been registered successfully.", HttpStatusCode.OK)
            );
        } catch (error) {
            console.error("Register Error:", error);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(false, "An unexpected error occurred to register user.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }
}