import type { ObjectId } from "mongodb";

export interface CourseProgress {
  id?: string | null;
  _id?: ObjectId | null;
  userId: ObjectId;
  courseId: ObjectId;
  quizScorePercent: number;
  progressPercent: number;
  passed: boolean;
  completedAt?: Date | null;
  attempts: number;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface CreateCourseProgressInput {
  userId: ObjectId;
  courseId: ObjectId;
  quizScorePercent?: number;
  progressPercent?: number;
  attempts?: number;
}

export const CourseProgressCollection = "courseProgress" as const;
export const CourseProgressFields = {
  id: "id",
  userId: "userId",
  courseId: "courseId",
  quizScorePercent: "quizScorePercent",
  progressPercent: "progressPercent",
  passed: "passed",
  completedAt: "completedAt",
  attempts: "attempts",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
} as const;

export function buildCourseProgress(
  input: CreateCourseProgressInput
): CourseProgress {
  const quizScorePercent = clampPercent(input.quizScorePercent ?? 0);
  const progressPercent = clampPercent(
    input.progressPercent ?? quizScorePercent
  );
  const passed = quizScorePercent >= 90;
  const now = new Date();

  return {
    id: null,
    userId: input.userId,
    courseId: input.courseId,
    quizScorePercent,
    progressPercent,
    passed,
    completedAt: passed ? now : null,
    attempts: input.attempts ?? 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function clampPercent(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}
