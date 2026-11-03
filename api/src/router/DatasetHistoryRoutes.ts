import { Router } from "express";
import { DatasetHistoryController } from "../controller/DatasetHistoryController";
import { JwtMiddleWare } from "../middleware/JwtMiddleWare";

const DatasetHistoryRouter = Router();

DatasetHistoryRouter.use(JwtMiddleWare);

DatasetHistoryRouter.get(
    "/GetHistory",
    DatasetHistoryController.GetHistory
);

export default DatasetHistoryRouter;
