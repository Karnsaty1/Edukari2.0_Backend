import type { ObjectId } from "mongodb";
import { getCollection } from "../../config/db";
import {
  CourseCollection,
  type Course,
} from "../../contracts/Course/Dtos/course";
import {
  CourseQuizCollection,
  type CourseQuizDocument,
} from "../../contracts/CourseQuiz/Dtos/quiz";

interface CourseDocument extends Course {
  _id?: ObjectId;
}

async function listCourses(page = 1, pageSize = 8) {
  const courses = getCollection<CourseDocument>(CourseCollection);
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.min(50, Math.floor(pageSize)));
  const skip = (safePage - 1) * safePageSize;

  const [items, total] = await Promise.all([
    courses.find({}).skip(skip).limit(safePageSize).toArray(),
    courses.countDocuments(),
  ]);

  return {
    items: items.map(sanitizeCourseSummary),
    meta: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
      hasNext: skip + safePageSize < total,
      hasPrev: safePage > 1,
    },
  };
}

async function getCourseById(courseId: ObjectId) {
  const courses = getCollection<CourseDocument>(CourseCollection);
  const course = await courses.findOne({ _id: courseId });

  if (!course) {
    const error = new Error("Course not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  return sanitizeCourseSummary(course);
}

async function getCourseBySlug(slug: string) {
  const courses = getCollection<CourseDocument>(CourseCollection);
  const course = await courses.findOne({ slug });

  if (!course) {
    const error = new Error("Course not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  return sanitizeCourseSummary(course);
}

async function getCourseQuizById(courseId: ObjectId) {
  const quizzes = getCollection<CourseQuizDocument>(CourseQuizCollection);
  const course = await quizzes.findOne({ courseId });

  if (!course) {
    const error = new Error("Course not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  return {
    id: course._id?.toString() || null,
    courseSlug: course.courseSlug,
    passScorePercent: course.passScorePercent,
    questions: course.questions,
  };
}

function sanitizeCourseSummary(course: CourseDocument) {
  return {
    id: course._id?.toString() || null,
    title: course.title,
    slug: course.slug,
    description: course.description,
    officialSite: course.officialSite,
    category: course.category || "",
    level: course.level || "",
    createdAt: course.createdAt || null,
    updatedAt: course.updatedAt || null,
  };
}

export {
  listCourses,
  getCourseById,
  getCourseBySlug,
  getCourseQuizById,
};
