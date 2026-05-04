import type { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import {
  getUserCourseProgress,
  listUserProgress,
  upsertUserCourseProgress,
} from "./progress.service";

function asParamValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function getAuthedUserId(req: Request): ObjectId {
  const user = (req as Request & { user?: { sub?: string } }).user;

  if (!user?.sub) {
    throw Object.assign(new Error("Authorization token is required"), {
      statusCode: 401,
    });
  }

  return new ObjectId(user.sub);
}

async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getAuthedUserId(req);
    const items = await listUserProgress(userId);
    res.status(200).json({
      items,
      meta: {
        total: items.length,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function meCourse(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getAuthedUserId(req);
    const courseId = asParamValue(req.params.courseId);
    const item = await getUserCourseProgress(userId, new ObjectId(courseId));

    if (!item) {
      return res.status(404).json({ message: "Progress not found" });
    }

    res.status(200).json(item);
  } catch (error) {
    next(error);
  }
}

async function attempt(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getAuthedUserId(req);
    const courseId = asParamValue(req.params.courseId);
    const { quizScorePercent, progressPercent, attempts } = req.body;

    const result = await upsertUserCourseProgress(
      userId,
      new ObjectId(courseId),
      Number(quizScorePercent ?? 0),
      Number(progressPercent ?? quizScorePercent ?? 0),
      Number(attempts ?? 0)
    );

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export { me, meCourse, attempt };
