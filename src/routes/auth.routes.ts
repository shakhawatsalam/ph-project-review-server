import { Router } from "express";
import {
  signup,
  login,
  getMe,
  logout,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { signupRateLimiter } from "../middleware/rate-limit.middleware.js";
const router = Router();

router.post("/signup", signupRateLimiter, signup);
router.post("/login", login);
router.get("/me", requireAuth, getMe);
router.post("/logout", logout);

export default router;
