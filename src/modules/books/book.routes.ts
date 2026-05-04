import { Router } from "express";
import { bySlug, detail, search } from "./book.controller";

const router = Router();

router.post("/", search);
router.post("/detail", detail);
router.post("/slug", bySlug);

export default router;
