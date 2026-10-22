import { Router } from "express";
import { DatasetController } from "../controller/DatasetController";
import JwtMiddleWare from "../middleware/JwtMiddleWare";

const DatasetRouter = Router();

DatasetRouter.use(JwtMiddleWare);

DatasetRouter.get("/GetAll", DatasetController.GetAll);

export default DatasetRouter;
