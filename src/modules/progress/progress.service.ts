import type { ObjectId } from "mongodb";
import { getCollection } from "../../config/db";
import {
  CourseProgressCollection,
  buildCourseProgress,
  type CourseProgress,
} from "../../contracts/Progress/Dtos/progress";

interface CourseProgressDocument extends CourseProgress {
  _id?: ObjectId;
}

async function listUserProgress(userId: ObjectId) {
  const progress = getCollection<CourseProgressDocument>(CourseProgressCollection);
  const items = await progress.find({ userId }).toArray();

  return items.map(sanitizeProgress);
}

async function getUserCourseProgress(userId: ObjectId, courseId: ObjectId) {
  const progress = getCollection<CourseProgressDocument>(CourseProgressCollection);
  const item = await progress.findOne({ userId, courseId });

  if (!item) {
    return null;
  }

  return sanitizeProgress(item);
}

async function upsertUserCourseProgress(
  userId: ObjectId,
  courseId: ObjectId,
  quizScorePercent: number,
  progressPercent: number,
  attempts = 0
) {
  const progress = getCollection<CourseProgressDocument>(CourseProgressCollection);
  const now = new Date();
  const record = buildCourseProgress({
    userId,
    courseId,
    quizScorePercent,
    progressPercent,
    attempts,
  });

  const { createdAt: _ignore, ...recordWithoutCreatedAt } = record as CourseProgressDocument & { createdAt?: Date };

  await progress.updateOne(
    { userId, courseId },
    {
      $set: {
        ...recordWithoutCreatedAt,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  const saved = await progress.findOne({ userId, courseId });
  return saved ? sanitizeProgress(saved) : sanitizeProgress(record as CourseProgressDocument);
}

function sanitizeProgress(item: CourseProgressDocument) {
  return {
    id: item._id?.toString() || item.id || null,
    userId: item.userId,
    courseId: item.courseId,
    quizScorePercent: item.quizScorePercent,
    progressPercent: item.progressPercent,
    passed: item.passed,
    completedAt: item.completedAt || null,
    attempts: item.attempts,
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
  };
}

export {
  listUserProgress,
  getUserCourseProgress,
  upsertUserCourseProgress,
};
