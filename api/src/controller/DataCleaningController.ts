import { Request, Response } from "express";
import { DataCleaningBusiness } from "../business/DataCleaningBusiness";
import { SuccessDto } from "../dto/SuccessDto";
import { ErrorDto } from "../dto/ErrorDto";
import { HttpStatusCode } from "../enum/HttpStatusCode";
import { Logger } from "../log/Logger";
import { HandleMissingValueRequest } from "../entity/DataCleaningEntity";

export class DataCleaningController {
    static async GetMissingValueReplacementStrategies(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("GetMissingValueReplacementStrategies -> Called", req.UserData?.id);

            const strategies = await DataCleaningBusiness.DoGetMissingValueReplacementStrategies();

            res.status(HttpStatusCode.OK).json(
                new SuccessDto(strategies, "Missing value replacement strategies retrieved successfully.", HttpStatusCode.OK)
            );
        } catch (error) {
            await Logger.Error("GetMissingValueReplacementStrategies Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred while fetching replacement strategies.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }

    static async HandleMissingValue(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("HandleMissingValue -> Called", req.UserData?.id);

            const payload: HandleMissingValueRequest = {
                datasetUid: String(req.body?.datasetUid ?? "").trim(),
                columnId: Number(req.body?.columnId),
                strategyId: Number(req.body?.strategyId),
                constantValue: req.body?.constantValue ?? null
            };

            const error = await DataCleaningBusiness.DoHandleMissingValue(Number(req.UserData!.id), payload);

            if (error) {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, error, HttpStatusCode.BAD_REQUEST));
                return;
            }

            res.status(HttpStatusCode.OK).json(
                new SuccessDto(true, "Missing-value handling process has been successfully queued.", HttpStatusCode.OK)
            );
        } catch (error) {
            await Logger.Error("HandleMissingValue Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred while queuing missing-value handling process.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }
}
