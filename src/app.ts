import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import authRoutes from "./modules/auth/auth.routes";
import courseRoutes from "./modules/courses/course.routes";
import bookRoutes from "./modules/books/book.routes";
import progressRoutes from "./modules/progress/progress.routes";
import liveRoutes from "./modules/live/live.routes";
import jobRoutes from "./modules/jobs/jobs.routes";
import { globalRateLimiter } from "./middlewares/rateLimiter";

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: function (origin, callback) {
        const clientOrigin = process.env.CLIENT_ORIGIN;
        const vercelPattern = /^https:\/\/edukari2-0-frontend.*\.vercel\.app\/?$/;
        if (
          !origin ||
          origin === clientOrigin ||
          vercelPattern.test(origin)
        ) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );

  app.use(
    session({
      secret: process.env.JWT_ACCESS_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.json());
  app.use(globalRateLimiter);

  app.get("/", (req: Request, res: Response) => {
    res.json({
      name: "Edukari API",
      version: "2.0",
      status: "running",
      timestamp: new Date().toISOString(),
      endpoints: {
        auth: "/api/auth",
        live: "/api/live",
        jobs: "/api/jobs",
        courses: "/courses",
        books: "/books",
        progress: "/progress",
        health: "/health",
      },
    });
  });

  app.get("/health", (req: Request, res: Response) => {
    res.json({ ok: true, message: "API is running" });
  });

  app.use("/auth", authRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/courses", courseRoutes);
  app.use("/books", bookRoutes);
  app.use("/progress", progressRoutes);
  app.use("/api/live", liveRoutes);
  app.use("/api/jobs", jobRoutes);
  app.use("/jobs", jobRoutes);

  app.use((req: Request, res: Response) => {
    res.status(404).json({ message: "Route not found" });
  });

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    const statusCode =
      typeof err === "object" && err && "statusCode" in err
        ? Number((err as { statusCode?: number }).statusCode) || 500
        : 500;
    const message =
      typeof err === "object" && err && "message" in err
        ? String((err as { message?: string }).message)
        : "Internal server error";

    res.status(statusCode).json({ message });
  });

  return app;
}

export { createApp };
