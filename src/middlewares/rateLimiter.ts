import rateLimit, { ipKeyGenerator } from "express-rate-limit";

type AuthedRequest = typeof import("express").request & { user?: { sub?: string } };

function keyGenerator(req: AuthedRequest): string {
  const user = (req as unknown as { user?: { sub?: string } }).user;
  return user?.sub || ipKeyGenerator(req);
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
