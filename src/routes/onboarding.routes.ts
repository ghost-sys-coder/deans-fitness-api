import { Router } from "express";
import { handleClientOnboarding } from "../controllers/onboarding.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// POST /api/onboarding/client
// Requires a valid Clerk session token in the Authorization header
router.post("/client", requireAuth, handleClientOnboarding);

export default router;
