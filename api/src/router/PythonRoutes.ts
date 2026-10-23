import { Router } from "express";
import { PythonController } from "../controller/PythonController";
import JwtMiddleWare from "../middleware/JwtMiddleWare";

const PythonRouter = Router();

// PythonRouter.use(JwtMiddleWare);

PythonRouter.get("/Functions", PythonController.Functions);
PythonRouter.get("/Ping", PythonController.Ping);
PythonRouter.get("/Echo", PythonController.Echo);
PythonRouter.get("/Add", PythonController.Add);
PythonRouter.get("/Divide", PythonController.Divide);

export default PythonRouter;
