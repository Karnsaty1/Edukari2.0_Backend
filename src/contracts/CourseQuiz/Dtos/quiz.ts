import type { ObjectId } from "mongodb";

export type QuizQuestionDifficulty = "easy" | "medium" | "hard";

export interface CourseQuizQuestion {
  id?: string | null;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  difficulty: QuizQuestionDifficulty;
}

export interface CourseQuizDocument {
  id?: string | null;
  _id?: ObjectId | null;
  courseId?: ObjectId | null;
  courseSlug: string;
  passScorePercent: number;
  questions: CourseQuizQuestion[];
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface CreateCourseQuizDocumentInput {
  courseSlug: string;
  passScorePercent: number;
  questions: CourseQuizQuestion[];
}

export const CourseQuizCollection = "courseQuizzes" as const;
export const CourseQuizFields = {
  id: "id",
  courseId: "courseId",
  courseSlug: "courseSlug",
  passScorePercent: "passScorePercent",
  questions: "questions",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
} as const;

export function buildCourseQuizDocument(
  input: CreateCourseQuizDocumentInput
): CourseQuizDocument {
  return {
    id: null,
    courseSlug: input.courseSlug,
    passScorePercent: input.passScorePercent,
    questions: input.questions,
    createdAt: null,
    updatedAt: null,
  };
}
