import { Router } from "express";
import { AuthenticationController } from "../controller/AuthenticationController";

const AuthenticationRouter = Router();

AuthenticationRouter.post("/Register", AuthenticationController.Register);
AuthenticationRouter.post("/Login", AuthenticationController.Login);

export default AuthenticationRouter;