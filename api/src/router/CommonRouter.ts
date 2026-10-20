import { Router } from "express";
import { CommonController } from "../controller/CommonController";

const CommonRouter = Router();

CommonRouter.get("/GetMenu", CommonController.GetMenu);

export default CommonRouter;