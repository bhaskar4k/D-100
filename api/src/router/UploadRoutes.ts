import express, { Router } from "express";
import { UploadController } from "../controller/UploadController";
import JwtMiddleWare from "../middleware/JwtMiddleWare";
import { ChunkSize } from "../business/UploadBusiness";

const UploadRouter = Router();

UploadRouter.use(JwtMiddleWare);

UploadRouter.post("/Initiate", UploadController.Initiate);
UploadRouter.put("/Chunk/:uploadId", express.raw({ type: "application/octet-stream", limit: ChunkSize }), UploadController.Chunk);
UploadRouter.post("/Complete", UploadController.Complete);

export default UploadRouter;
