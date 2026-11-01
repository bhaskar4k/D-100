import { Request, Response } from "express";
import { DataCleaningBusiness } from "../business/DataCleaningBusiness";
import { SuccessDto } from "../dto/SuccessDto";
import { ErrorDto } from "../dto/ErrorDto";
import { HttpStatusCode } from "../enum/HttpStatusCode";
import { Logger } from "../log/Logger";

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
}
