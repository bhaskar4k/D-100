import { Request, Response } from "express";
import { DatasetService } from "../business/DatasetService";
import { SuccessDto } from "../dto/SuccessDto";
import { ErrorDto } from "../dto/ErrorDto";
import { HttpStatusCode } from "../enum/HttpStatusCode";

const DefaultPageSize = 10;
const MaxPageSize = 100;
const MaxSearchLength = 100;


export class DatasetController {
    static async GetAll(req: Request, res: Response): Promise<void> {
        try {
            const page = Math.max(1, Math.floor(Number(req.query.page)) || 1);
            const pageSize = Math.min(MaxPageSize, Math.max(1, Math.floor(Number(req.query.pageSize)) || DefaultPageSize));

            const search = String(req.query.search ?? "").trim().slice(0, MaxSearchLength);

            const result = await DatasetService.GetDatasets(page, pageSize, search);

            res.status(HttpStatusCode.OK).json(new SuccessDto(result, "Datasets retrieved successfully.", HttpStatusCode.OK));
        } catch (error) {
            console.error("GetAll Datasets Error:", error);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred to get datasets.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }
}
