import { Request, Response } from "express";
import { DatasetService } from "../business/DatasetService";
import { SuccessDto } from "../dto/SuccessDto";
import { ErrorDto } from "../dto/ErrorDto";
import { HttpStatusCode } from "../enum/HttpStatusCode";
import { Logger } from "../log/Logger";

const DefaultPageSize = 10;
const MaxPageSize = 100;
const MaxSearchLength = 100;


export class DatasetController {
    static async GetAll(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("GetAllDatasets -> Called", req.UserData?.id);

            const page = Math.max(1, Math.floor(Number(req.query.page)) || 1);
            const pageSize = Math.min(MaxPageSize, Math.max(1, Math.floor(Number(req.query.pageSize)) || DefaultPageSize));

            const search = String(req.query.search ?? "").trim().slice(0, MaxSearchLength);

            const result = await DatasetService.GetDatasets(Number(req.UserData!.id), page, pageSize, search);

            res.status(HttpStatusCode.OK).json(new SuccessDto(result, "Datasets retrieved successfully.", HttpStatusCode.OK));
        } catch (error) {
            await Logger.Error("GetAll Datasets Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred to get datasets.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }


    static async Process(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("DatasetProcess -> Called", req.UserData?.id);

            const datasetUid = String(req.body?.datasetUid ?? "").trim();

            const error = await DatasetService.Process(Number(req.UserData!.id), datasetUid);

            if (error) {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, error, HttpStatusCode.BAD_REQUEST));
                return;
            }

            res.status(HttpStatusCode.OK).json(
                new SuccessDto(true, "Dataset has been successfully queued for processing.", HttpStatusCode.OK)
            );
        } catch (error) {
            await Logger.Error("Dataset Process Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred while queueing the dataset.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }
}
