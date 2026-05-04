import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token =
    authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  try {
    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      return res
        .status(500)
        .json({ message: "JWT_ACCESS_SECRET or JWT_SECRET is not configured" });
    }

    const payload = jwt.verify(token, secret) as { tokenType?: string };

    if (payload.tokenType !== "access") {
      return res.status(401).json({ message: "Invalid access token" });
    }

    (req as Request & { user?: unknown }).user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export { authenticateToken };
