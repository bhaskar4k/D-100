import { Router } from "express";
import { DatasetController } from "../controller/DatasetController";
import JwtMiddleWare from "../middleware/JwtMiddleWare";

const DatasetRouter = Router();

DatasetRouter.use(JwtMiddleWare);

DatasetRouter.get("/GetAll", DatasetController.GetAll);
DatasetRouter.get("/GetDeleted", DatasetController.GetDeleted);
DatasetRouter.get("/GetDetails/:datasetUid", DatasetController.GetDetails);
DatasetRouter.get("/Preview/:datasetUid", DatasetController.Preview);
DatasetRouter.get("/DownloadIngestedDataset/:datasetUid", DatasetController.DownloadIngestedDataset);
DatasetRouter.get("/DownloadRawDataset/:datasetUid", DatasetController.DownloadRawDataset);
DatasetRouter.post("/PrepareDownloadIngestedDataset", DatasetController.PrepareDownloadIngestedDataset);
DatasetRouter.post("/Process", DatasetController.Process);
DatasetRouter.post("/UpdateName", DatasetController.UpdateName);
DatasetRouter.post("/UpdateColumnName", DatasetController.UpdateColumnName);
DatasetRouter.post("/DeleteColumn", DatasetController.DeleteColumn);
DatasetRouter.post("/Delete", DatasetController.Delete);
DatasetRouter.post("/Restore", DatasetController.Restore);

export default DatasetRouter;
