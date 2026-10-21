import { Router } from "express";
import { CommonController } from "../controller/CommonController";
import { OptionalJwtMiddleWare } from "../middleware/JwtMiddleWare";

const CommonRouter = Router();

CommonRouter.get("/GetMenu", OptionalJwtMiddleWare, CommonController.GetMenu);

export default CommonRouter;