import { Router } from "express";
import { ProcessingController } from "../controller/ProcessingController";
import JwtMiddleWare from "../middleware/JwtMiddleWare";

const ProcessingRouter = Router();

ProcessingRouter.use(JwtMiddleWare);

ProcessingRouter.get("/GetQueueStatus", ProcessingController.GetQueueStatus);

export default ProcessingRouter;
