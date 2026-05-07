import rateLimit from "express-rate-limit";

// 20 hits per minute per user — applied globally
const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => {
    const user = (req as typeof req & { user?: { sub?: string } }).user;
    return user?.sub || req.ip || "anonymous";
  },
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 12 hits per minute per IP — applied to specific routes
const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  keyGenerator: (req) => {
    const user = (req as typeof req & { user?: { sub?: string } }).user;
    return user?.sub || req.ip || "anonymous";
  },
  message: { message: "Too many requests on this endpoint, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export { globalRateLimiter, strictRateLimiter };
