import { Request, Response } from "express";
import { ProcessingService } from "../business/ProcessingService";
import { SuccessDto } from "../dto/SuccessDto";
import { ErrorDto } from "../dto/ErrorDto";
import { HttpStatusCode } from "../enum/HttpStatusCode";
import { Logger } from "../log/Logger";


export class ProcessingController {
    static async GetQueueStatus(req: Request, res: Response): Promise<void> {
        try {
            // await Logger.Info("GetQueueStatus -> Called", req.UserData?.id);

            const result = await ProcessingService.GetQueueStatus();

            res.status(HttpStatusCode.OK).json(
                new SuccessDto(result, "Queue status retrieved successfully.", HttpStatusCode.OK)
            );
        } catch (error) {
            await Logger.Error("GetQueueStatus Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred while fetching queue status.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }
}
