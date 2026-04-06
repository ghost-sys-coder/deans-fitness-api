import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";

// routes
import webhookRoutes from "./routes/webhook.routes.js";

const app = express();

// logging (development only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// webhook route registers the JSON parser
app.use("/webhooks/clerk", webhookRoutes);


// middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());

// health check
app.get("/health", (_req, res) => {
  res.json({ status: "app is running" });
});

// routes

export default app;
