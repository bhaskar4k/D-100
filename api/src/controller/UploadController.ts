import { Request, Response } from "express";
import { UploadBusiness } from "../business/UploadBusiness";
import { GetAllowedExtensions } from "../util/UploadUtil";
import { SuccessDto } from "../dto/SuccessDto";
import { ErrorDto } from "../dto/ErrorDto";
import { HttpStatusCode } from "../enum/HttpStatusCode";


export class UploadController {
    static async Initiate(req: Request, res: Response): Promise<void> {
        try {
            const { fileName, fileSize } = req.body ?? {};

            if (typeof fileName !== "string" || !fileName.trim()) {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, "File name is required.", HttpStatusCode.BAD_REQUEST));
                return;
            }

            if (!UploadBusiness.IsSupportedFile(fileName)) {
                res.status(HttpStatusCode.OK).json(
                    new ErrorDto(false, `Unsupported file type. Allowed: ${GetAllowedExtensions().join(", ")}`, HttpStatusCode.BAD_REQUEST)
                );
                return;
            }

            if (!Number.isSafeInteger(fileSize) || fileSize <= 0) {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, "A valid file size is required.", HttpStatusCode.BAD_REQUEST));
                return;
            }

            const result = await UploadBusiness.DoInitiate(String(req.UserData!.id), fileName, fileSize);

            res.status(HttpStatusCode.OK).json(new SuccessDto(result, "Upload initiated successfully.", HttpStatusCode.OK));
        } catch (error) {
            console.error("Upload Initiate Error:", error);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(false, "An unexpected error occurred while initiating upload.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }


    static async Chunk(req: Request, res: Response): Promise<void> {
        try {
            const uploadId = String(req.params.uploadId);
            const index = Number(req.query.index);

            if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, "Chunk data is required.", HttpStatusCode.BAD_REQUEST));
                return;
            }

            const error = await UploadBusiness.DoUploadChunk(String(req.UserData!.id), uploadId, index, req.body);

            if (error) {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, error, HttpStatusCode.BAD_REQUEST));
                return;
            }

            res.status(HttpStatusCode.OK).json(new SuccessDto(true, "Chunk uploaded successfully.", HttpStatusCode.OK));
        } catch (error) {
            console.error("Upload Chunk Error:", error);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(false, "An unexpected error occurred while uploading chunk.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }


    static async Complete(req: Request, res: Response): Promise<void> {
        try {
            const uploadId = String(req.body?.uploadId ?? "");

            const error = await UploadBusiness.DoComplete(String(req.UserData!.id), uploadId);

            if (error) {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, error, HttpStatusCode.BAD_REQUEST));
                return;
            }

            res.status(HttpStatusCode.OK).json(new SuccessDto(true, "File uploaded successfully.", HttpStatusCode.OK));
        } catch (error) {
            console.error("Upload Complete Error:", error);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(false, "An unexpected error occurred while completing upload.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }
}
