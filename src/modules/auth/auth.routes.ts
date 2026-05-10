import { Router } from "express";
import passport from "./auth.passport";
import { login, googleLogin, register, refresh, me } from "./auth.controller";
import { authenticateToken } from "./auth.middleware";

const router = Router();

router.post("/login", login);
router.post("/google", googleLogin);
router.post("/register", register);
router.post("/refresh", refresh);
router.get("/me", authenticateToken, me);

// Google OAuth - server-side redirects
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_ORIGIN}/login?error=google_auth_failed` }),
  (req, res) => {
    const tokens = (req.user as any).userTokens;
    const userId = (req.user as any).userId;
    
    // Redirect to frontend with tokens
    const redirectUrl = `${process.env.CLIENT_ORIGIN}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&userId=${userId}`;
    res.redirect(redirectUrl);
  }
);

export default router;
