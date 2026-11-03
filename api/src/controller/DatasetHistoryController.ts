import { Request, Response } from "express";
import { DatasetHistoryBusiness } from "../business/DatasetHistoryBusiness";
import { SuccessDto } from "../dto/SuccessDto";
import { ErrorDto } from "../dto/ErrorDto";
import { HttpStatusCode } from "../enum/HttpStatusCode";
import { Logger } from "../log/Logger";

export class DatasetHistoryController {
    static async GetHistory(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("DatasetHistory.GetHistory -> Called", req.UserData?.id);

            const datasetUid = String(req.query?.datasetUid ?? "").trim();
            const actionType = String(req.query?.actionType ?? "").trim();

            const result = await DatasetHistoryBusiness.DoGetHistory(
                Number(req.UserData!.id),
                datasetUid,
                actionType
            );

            if (typeof result === "string") {
                res.status(HttpStatusCode.OK).json(
                    new ErrorDto(null, result, HttpStatusCode.BAD_REQUEST)
                );
                return;
            }

            res.status(HttpStatusCode.OK).json(
                new SuccessDto(result, "Dataset history retrieved successfully.", HttpStatusCode.OK)
            );
        } catch (error) {
            await Logger.Error("DatasetHistory.GetHistory Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred while fetching dataset history.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }
}
