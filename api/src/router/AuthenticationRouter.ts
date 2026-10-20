import { Router } from "express";
import { AuthenticationController } from "../controller/AuthenticationController";

const AuthenticationRouter = Router();

AuthenticationRouter.post("/Register", AuthenticationController.Register);


export default AuthenticationRouter;