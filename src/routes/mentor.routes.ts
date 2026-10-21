import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  getAllProjects,
  getMentorStats,
  reviewProject,
} from "../controllers/mentor.controller.js";

const router = Router();

router.get("/projects", requireAuth, requireRole("MENTOR"), getAllProjects);
router.patch(
  "/projects/:id/review",
  requireAuth,
  requireRole("MENTOR"),
  reviewProject,
);
router.get("/stats", requireAuth, requireRole("MENTOR"), getMentorStats);
export default router;
