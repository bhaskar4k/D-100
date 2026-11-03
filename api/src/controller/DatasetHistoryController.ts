import { Request, Response } from "express";
import { DatasetHistoryBusiness } from "../business/DatasetHistoryBusiness";
import { SuccessDto } from "../dto/SuccessDto";
import { ErrorDto } from "../dto/ErrorDto";
import { HttpStatusCode } from "../enum/HttpStatusCode";
import { DatasetHistoryActionType } from "../enum/DatasetHistoryActionType";
import { Logger } from "../log/Logger";

export class DatasetHistoryController {
    static async GetHistory(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("DatasetHistory.GetHistory -> Called", req.UserData?.id);

            const datasetUid = String(req.query?.datasetUid ?? "").trim();
            const actionType = String(req.query?.actionType ?? "").trim();
            const userId = Number(req.UserData!.id);

            // Dispatch to the action-specific business method. Each action's response shape
            // can diverge (e.g. missing-value lifts replacement_strategy_name out of state),
            // so the business layer is specialized rather than generic.
            let result: unknown[] | string;

            switch (actionType) {
                case DatasetHistoryActionType.MISSING_VALUE_HANDLING:
                    result = await DatasetHistoryBusiness.DoGetMissingValueHandlingHistory(userId, datasetUid);
                    break;

                default:
                    res.status(HttpStatusCode.OK).json(
                        new ErrorDto(null, "A valid action type is required.", HttpStatusCode.BAD_REQUEST)
                    );
                    return;
            }

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
