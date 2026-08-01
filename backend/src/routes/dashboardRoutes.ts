import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getDashboardData,
  getLearningProfile,
  getRoadmapData,
  getAnalysis,
  getInsights,
  getMemory,
  getVisualizer,
  getFutureSelf,
  getOpportunities,
  getAchievements,
  getReflections,
} from "../controllers/dashboardController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/profile", authenticateToken, getProfile);
router.put("/profile", authenticateToken, updateProfile);
router.get("/dashboard", authenticateToken, getDashboardData);
router.get("/learning-profile", authenticateToken, getLearningProfile);
router.get("/roadmap", authenticateToken, getRoadmapData);
router.get("/analysis", authenticateToken, getAnalysis);
router.get("/insights", authenticateToken, getInsights);
router.get("/memory", authenticateToken, getMemory);
router.get("/visualizer", authenticateToken, getVisualizer);
router.get("/future-self", authenticateToken, getFutureSelf);
router.get("/opportunities", authenticateToken, getOpportunities);
router.get("/achievements", authenticateToken, getAchievements);
router.get("/reflections", authenticateToken, getReflections);

export default router;
