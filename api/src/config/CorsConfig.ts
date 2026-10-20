import cors, { CorsOptions } from "cors";

const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN;

if (!ALLOW_ORIGIN) {
    throw new Error("ALLOW_ORIGIN is not configured in .env");
}

const AllowedOrigins = ALLOW_ORIGIN
    .split(",")
    .map((origin) => origin.trim());

const Options: CorsOptions = {
    origin: (origin, callback) => {
        if (!origin || AllowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS blocked origin: ${origin}`));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

const CorsConfig = cors(Options);

export default CorsConfig;