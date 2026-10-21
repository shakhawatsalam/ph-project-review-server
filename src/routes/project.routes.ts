import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  createProject,
  getMyProject,
} from "../controllers/project.controller.js";

const router = Router();

router.post("/", requireAuth, requireRole("STUDENT"), createProject);
router.get("/mine", requireAuth, requireRole("STUDENT"), getMyProject);

export default router;
