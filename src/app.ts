import express from "express";
import helmet from "helmet";
import cors, { type CorsOptions } from "cors";
import authRoutes from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
const app = express();

const corsOptions: CorsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Project Review API is running",
  });
});

export default app;
