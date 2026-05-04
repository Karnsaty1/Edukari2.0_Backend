import type { ObjectId } from "mongodb";

export interface Course {
  id?: string | null;
  _id?: ObjectId | null;
  title: string;
  slug: string;
  description: string;
  officialSite: string;
  category?: string;
  level?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface CreateCourseInput {
  title: string;
  slug: string;
  description: string;
  officialSite: string;
  category?: string;
  level?: string;
}

export const CourseCollection = "courses" as const;
export const CourseFields = {
  id: "id",
  title: "title",
  slug: "slug",
  description: "description",
  officialSite: "officialSite",
  category: "category",
  level: "level",
  quiz: "quiz",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
} as const;

export function buildCourse(input: CreateCourseInput): Course {
  return {
    id: null,
    title: input.title,
    slug: input.slug,
    description: input.description,
    officialSite: input.officialSite,
    category: input.category || "",
    level: input.level || "",
    createdAt: null,
    updatedAt: null,
  };
}
