import { Router } from "express";
import { login, googleLogin, register, refresh, me } from "./auth.controller";
import { authenticateToken } from "./auth.middleware";

const router = Router();

router.post("/login", login);
router.post("/google", googleLogin);
router.post("/register", register);
router.post("/refresh", refresh);
router.get("/me", authenticateToken, me);

export default router;
