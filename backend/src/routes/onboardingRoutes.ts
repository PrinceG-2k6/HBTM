import { Router } from "express";
import { getAttributes, getQuestions, submitOnboarding } from "../controllers/onboardingController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/attributes", getAttributes);
router.get("/questions", getQuestions);
router.post("/submit", authenticateToken, submitOnboarding);

export default router;
