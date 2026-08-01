import { Router } from "express";
import { getCuratedFeed } from "../controllers/curationController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/feed", authenticateToken, getCuratedFeed);

export default router;
