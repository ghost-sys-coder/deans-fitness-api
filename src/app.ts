import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";

// routes
import webhookRoutes from "./routes/webhook.routes.js";
import onboardingRoutes from "./routes/onboarding.routes.js";

const app = express();

// logging (development only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Webhook route must be mounted before express.json() — needs raw body for svix verification
app.use("/webhooks/clerk", webhookRoutes);

// Global middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "app is running" });
});

// Routes
app.use("/api/onboarding", onboardingRoutes);

export default app;
