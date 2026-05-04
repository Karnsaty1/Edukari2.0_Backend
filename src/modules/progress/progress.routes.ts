import { Router } from "express";
import { authenticateToken } from "../auth/auth.middleware";
import { me, meCourse, attempt } from "./progress.controller";

const router = Router();

router.get("/me", authenticateToken, me);
router.get("/me/:courseId", authenticateToken, meCourse);
router.post("/me/:courseId/attempt", authenticateToken, attempt);

export default router;
