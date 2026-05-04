import { Router } from "express";
import { list, detail, bySlug, quiz } from "./course.controller";

const router = Router();

router.get("/", list);
router.get("/slug/:slug", bySlug);
router.get("/:courseId", detail);
router.get("/:courseId/quiz", quiz);

export default router;
