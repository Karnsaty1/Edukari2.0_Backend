import type { ObjectId } from "mongodb";

export interface Book {
  id?: string | null;
  _id?: ObjectId | null;
  title: string;
  slug: string;
  author: string;
  description: string;
  officialSite: string;
  category?: string;
  level?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export const BookCollection = "books" as const;

export const BookFields = {
  id: "id",
  title: "title",
  slug: "slug",
  author: "author",
  description: "description",
  officialSite: "officialSite",
  category: "category",
  level: "level",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
} as const;
