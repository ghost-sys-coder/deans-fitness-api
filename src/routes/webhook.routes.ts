import express, { Router } from "express";
import { handleClerkWebhook } from "../controllers/webhook.controller.js";

const router = Router();

// Clerk requires the raw body for signature verification — do NOT use express.json() here
router.post("/", express.raw({ type: "application/json" }), handleClerkWebhook);

export default router;
