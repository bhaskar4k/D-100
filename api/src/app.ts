import express from "express";
import cors from "cors";
import { HttpStatusCode } from "./enum/HttpStatusCode";
import { SuccessDto } from "./dto/SuccessDto";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
    res.status(HttpStatusCode.OK).json(
        new SuccessDto(
            true,
            "Health check successful",
            HttpStatusCode.OK
        )
    );
});

export default app;