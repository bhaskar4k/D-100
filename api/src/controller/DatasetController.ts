import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import archiver from "archiver";
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


    static async GetDeleted(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("GetDeletedDatasets -> Called", req.UserData?.id);

            const page = Math.max(1, Math.floor(Number(req.query.page)) || 1);
            const pageSize = Math.min(MaxPageSize, Math.max(1, Math.floor(Number(req.query.pageSize)) || DefaultPageSize));

            const search = String(req.query.search ?? "").trim().slice(0, MaxSearchLength);

            const result = await DatasetService.GetDeletedDatasets(Number(req.UserData!.id), page, pageSize, search);

            res.status(HttpStatusCode.OK).json(new SuccessDto(result, "Deleted datasets retrieved successfully.", HttpStatusCode.OK));
        } catch (error) {
            await Logger.Error("GetDeleted Datasets Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred to get deleted datasets.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }


    static async Restore(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("DatasetRestore -> Called", req.UserData?.id);

            const datasetUid = String(req.body?.datasetUid ?? "").trim();

            const error = await DatasetService.Restore(Number(req.UserData!.id), datasetUid);

            if (error) {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, error, HttpStatusCode.BAD_REQUEST));
                return;
            }

            res.status(HttpStatusCode.OK).json(
                new SuccessDto(true, "Dataset restored successfully.", HttpStatusCode.OK)
            );
        } catch (error) {
            await Logger.Error("Dataset Restore Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred while restoring the dataset.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }


    static async GetDetails(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("GetDatasetDetails -> Called", req.UserData?.id);

            const datasetUid = String(req.params.datasetUid ?? "").trim();

            const result = await DatasetService.GetDetails(Number(req.UserData!.id), datasetUid);

            if (typeof result === "string") {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, result, HttpStatusCode.BAD_REQUEST));
                return;
            }

            res.status(HttpStatusCode.OK).json(
                new SuccessDto(result, "Dataset details retrieved successfully.", HttpStatusCode.OK)
            );
        } catch (error) {
            await Logger.Error("Get Dataset Details Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred while fetching the dataset details.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }


    static async PrepareDownload(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("PrepareDownload -> Called", req.UserData?.id);

            const datasetUid = String(req.body?.datasetUid ?? "").trim();
            const downloadedFileType = Number(req.body?.downloadedFileType);

            const result = await DatasetService.PrepareDownload(Number(req.UserData!.id), datasetUid, downloadedFileType);

            if (typeof result === "string") {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, result, HttpStatusCode.BAD_REQUEST));
                return;
            }

            res.status(HttpStatusCode.OK).json(
                new SuccessDto(result, "Download prepared successfully.", HttpStatusCode.OK)
            );
        } catch (error) {
            await Logger.Error("Prepare Download Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred while preparing the download.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }


    static async Download(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("DatasetDownload -> Called", req.UserData?.id);

            const datasetUid = String(req.params.datasetUid ?? "").trim();
            const userId = Number(req.UserData!.id);

            const plan = await DatasetService.ResolveDownload(userId, datasetUid);

            if (typeof plan === "string") {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, plan, HttpStatusCode.BAD_REQUEST));
                return;
            }

            const folderPath = DatasetService.GetDownloadFolderPath(userId, datasetUid);

            // Use RFC 5987 attribute for the UTF-8 variant so non-ASCII characters in a
            // dataset name do not break browser downloads.
            const asciiFallback = plan.suggestedDownloadName.replace(/[^\x20-\x7e]/g, "_");
            const disposition = `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(plan.suggestedDownloadName)}`;
            res.setHeader("Content-Disposition", disposition);

            if (!plan.isArchive) {
                const filePath = path.join(folderPath, plan.files[0]);
                const extension = path.extname(filePath).toLowerCase();
                const contentType = extension === ".csv" ? "text/csv" : "application/octet-stream";
                res.setHeader("Content-Type", contentType);

                const stream = fs.createReadStream(filePath);
                stream.on("error", (streamError) => {
                    void Logger.Error("Dataset Download file stream error", streamError, userId);
                    if (!res.headersSent) {
                        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).end();
                    } else {
                        res.destroy(streamError as Error);
                    }
                });
                stream.pipe(res);
                return;
            }

            // Excel: zip the folder's chunk files on the fly so the client receives a single
            // archive without the server having to pre-build and persist it on disk.
            res.setHeader("Content-Type", "application/zip");

            const archive = archiver("zip", { zlib: { level: 6 } });

            archive.on("warning", (warning) => {
                void Logger.Error("Dataset Download archive warning", warning, userId);
            });

            archive.on("error", (archiveError) => {
                void Logger.Error("Dataset Download archive error", archiveError, userId);
                if (!res.headersSent) {
                    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).end();
                } else {
                    res.destroy(archiveError);
                }
            });

            archive.pipe(res);
            for (const FileName of plan.files) {
                archive.file(path.join(folderPath, FileName), { name: FileName });
            }
            await archive.finalize();
        } catch (error) {
            await Logger.Error("Dataset Download Error", error, req.UserData?.id);

            if (!res.headersSent) {
                res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                    new ErrorDto(null, "An unexpected error occurred while downloading the dataset.", HttpStatusCode.INTERNAL_SERVER_ERROR)
                );
            }
        }
    }


    static async Preview(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("PreviewDataset -> Called", req.UserData?.id);

            const datasetUid = String(req.params.datasetUid ?? "").trim();

            const result = await DatasetService.Preview(Number(req.UserData!.id), datasetUid);

            if (typeof result === "string") {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, result, HttpStatusCode.BAD_REQUEST));
                return;
            }

            res.status(HttpStatusCode.OK).json(
                new SuccessDto(result, "Dataset preview retrieved successfully.", HttpStatusCode.OK)
            );
        } catch (error) {
            await Logger.Error("Preview Dataset Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred while fetching the dataset preview.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }


    static async DeleteColumn(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("DatasetDeleteColumn -> Called", req.UserData?.id);

            const datasetUid = String(req.body?.datasetUid ?? "").trim();
            const columnId = Number(req.body?.columnId);

            const error = await DatasetService.DeleteColumn(Number(req.UserData!.id), datasetUid, columnId);

            if (error) {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, error, HttpStatusCode.BAD_REQUEST));
                return;
            }

            res.status(HttpStatusCode.OK).json(
                new SuccessDto(true, "Column has been successfully deleted.", HttpStatusCode.OK)
            );
        } catch (error) {
            await Logger.Error("Dataset DeleteColumn Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred while deleting the column.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }


    static async UpdateColumnName(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("DatasetUpdateColumnName -> Called", req.UserData?.id);

            const datasetUid = String(req.body?.datasetUid ?? "").trim();
            const columnId = Number(req.body?.columnId);
            const newName = String(req.body?.newName ?? "");

            const error = await DatasetService.UpdateColumnName(Number(req.UserData!.id), datasetUid, columnId, newName);

            if (error) {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, error, HttpStatusCode.BAD_REQUEST));
                return;
            }

            res.status(HttpStatusCode.OK).json(
                new SuccessDto(true, "Column name has been successfully updated.", HttpStatusCode.OK)
            );
        } catch (error) {
            await Logger.Error("Dataset UpdateColumnName Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred while renaming the column.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }


    static async UpdateName(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("DatasetUpdateName -> Called", req.UserData?.id);

            const datasetUid = String(req.body?.datasetUid ?? "").trim();
            const newName = String(req.body?.newName ?? "");

            const error = await DatasetService.UpdateName(Number(req.UserData!.id), datasetUid, newName);

            if (error) {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, error, HttpStatusCode.BAD_REQUEST));
                return;
            }

            res.status(HttpStatusCode.OK).json(
                new SuccessDto(true, "Dataset name has been successfully updated.", HttpStatusCode.OK)
            );
        } catch (error) {
            await Logger.Error("Dataset UpdateName Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred while renaming the dataset.", HttpStatusCode.INTERNAL_SERVER_ERROR)
            );
        }
    }


    static async Delete(req: Request, res: Response): Promise<void> {
        try {
            await Logger.Info("DatasetDelete -> Called", req.UserData?.id);

            const datasetUid = String(req.body?.datasetUid ?? "").trim();

            const error = await DatasetService.Delete(Number(req.UserData!.id), datasetUid);

            if (error) {
                res.status(HttpStatusCode.OK).json(new ErrorDto(false, error, HttpStatusCode.BAD_REQUEST));
                return;
            }

            res.status(HttpStatusCode.OK).json(
                new SuccessDto(true, "Dataset has been deleted successfully.", HttpStatusCode.OK)
            );
        } catch (error) {
            await Logger.Error("Dataset Delete Error", error, req.UserData?.id);

            res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
                new ErrorDto(null, "An unexpected error occurred while deleting the dataset.", HttpStatusCode.INTERNAL_SERVER_ERROR)
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
