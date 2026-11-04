import { Router } from "express";
import { UserProfileController } from "../controller/UserProfileController";
import { JwtMiddleWare } from "../middleware/JwtMiddleWare";

const UserProfileRouter = Router();

UserProfileRouter.use(JwtMiddleWare);

UserProfileRouter.get("/GetDetails", UserProfileController.GetDetails);

export default UserProfileRouter;
