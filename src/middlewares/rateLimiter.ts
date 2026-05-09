import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

function keyGenerator(req: Request): string {
  const user = (req as Request & { user?: { sub?: string } }).user;
  if (user?.sub) return user.sub;
  return ipKeyGenerator(req as unknown as Parameters<typeof ipKeyGenerator>[0]);
}

// 20 hits per minute per user — applied globally
const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 12 hits per minute per user — applied to specific routes
const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  keyGenerator,
  message: { message: "Too many requests on this endpoint, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export { globalRateLimiter, strictRateLimiter };
