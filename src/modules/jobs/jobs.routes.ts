import { Router } from "express";
import { strictRateLimiter } from "../../middlewares/rateLimiter";
import { search } from "./jobs.controller";

const router = Router();

router.post("/search", strictRateLimiter, search);

export default router;
