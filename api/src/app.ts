import express from "express";
import cors from "cors";
import { ConnectionPool } from "./data-access-layer/database";
import { HttpStatusCode } from "./enum/HttpStatusCode";
import { SuccessDto } from "./dto/SuccessDto";
import { ErrorDto } from "./dto/ErrorDto";
import CommonRouter from "./router/CommonRouter";

const app = express();

app.use(cors());
app.use(express.json());

// Routers
app.use("/Api/Common", CommonRouter);


app.get("/api/health", async (_req, res) => {
    try {
        const DB = await ConnectionPool;
        await DB.query("SELECT 1");

        res.status(HttpStatusCode.OK).json(
            new SuccessDto(
                true,
                "API and Database Are healthy ✅ 💪",
                HttpStatusCode.OK
            )
        );
    } catch {
        res.status(HttpStatusCode.SERVICE_UNAVAILABLE).json(
            new ErrorDto(
                false,
                "Database Connection Failed ❌ 💥",
                HttpStatusCode.SERVICE_UNAVAILABLE
            )
        );
    }
});

export default app;