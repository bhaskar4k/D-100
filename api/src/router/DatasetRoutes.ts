import { Router } from "express";
import { DatasetController } from "../controller/DatasetController";
import JwtMiddleWare from "../middleware/JwtMiddleWare";

const DatasetRouter = Router();

DatasetRouter.use(JwtMiddleWare);

DatasetRouter.get("/GetAll", DatasetController.GetAll);
DatasetRouter.get("/GetDetails/:datasetUid", DatasetController.GetDetails);
DatasetRouter.post("/Process", DatasetController.Process);
DatasetRouter.post("/UpdateName", DatasetController.UpdateName);
DatasetRouter.post("/UpdateColumnName", DatasetController.UpdateColumnName);
DatasetRouter.post("/Delete", DatasetController.Delete);

export default DatasetRouter;
