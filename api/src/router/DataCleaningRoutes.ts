import { Router } from "express";
import { DataCleaningController } from "../controller/DataCleaningController";
import { JwtMiddleWare } from "../middleware/JwtMiddleWare";

const DataCleaningRouter = Router();

DataCleaningRouter.use(JwtMiddleWare);

DataCleaningRouter.get(
    "/GetMissingValueReplacementStrategies",
    DataCleaningController.GetMissingValueReplacementStrategies
);

DataCleaningRouter.post(
    "/HandleMissingValue",
    DataCleaningController.HandleMissingValue
);

export default DataCleaningRouter;
