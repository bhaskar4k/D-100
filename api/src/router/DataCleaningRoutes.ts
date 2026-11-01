import { Router } from "express";
import { DataCleaningController } from "../controller/DataCleaningController";
import { JwtMiddleWare } from "../middleware/JwtMiddleWare";

const DataCleaningRouter = Router();

DataCleaningRouter.get(
    "/GetMissingValueReplacementStrategies",
    JwtMiddleWare,
    DataCleaningController.GetMissingValueReplacementStrategies
);

export default DataCleaningRouter;
