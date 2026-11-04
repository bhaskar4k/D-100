import { Router } from "express";
import { UserStorageController } from "../controller/UserStorageController";
import { JwtMiddleWare } from "../middleware/JwtMiddleWare";

const UserStorageRouter = Router();

UserStorageRouter.use(JwtMiddleWare);

UserStorageRouter.get("/GetDetails", UserStorageController.GetDetails);

export default UserStorageRouter;
