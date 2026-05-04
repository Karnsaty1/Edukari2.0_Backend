import type { ObjectId } from "mongodb";
import { getCollection } from "../../config/db";
import { BookCollection, type Book } from "../../contracts/Book/Dtos/book";
import type { SearchBooksCommand } from "../../contracts/Book/Commands/searchBooksCommand";
import type { SearchBooksResponse } from "../../contracts/Book/Responses/searchBooksResponse";

interface BookDocument extends Book {
  _id?: ObjectId;
}

type BookListFilters = {
  name?: string;
  category?: string;
  level?: string;
  author?: string;
  q?: string;
};

function normalizeValue(value?: string | null): string | undefined {
  const trimmed = String(value || "").trim();
  return trimmed ? trimmed : undefined;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildBookQuery(filters: BookListFilters) {
  const query: Record<string, unknown> = {};

  if (filters.name) {
    query.title = { $regex: escapeRegex(filters.name), $options: "i" };
  }

  if (filters.category) {
    query.category = { $regex: `^${escapeRegex(filters.category)}$`, $options: "i" };
  }

  if (filters.level) {
    query.level = { $regex: `^${escapeRegex(filters.level)}$`, $options: "i" };
  }

  if (filters.author) {
    query.author = { $regex: escapeRegex(filters.author), $options: "i" };
  }

  if (filters.q) {
    const search = escapeRegex(filters.q);
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { slug: { $regex: search, $options: "i" } },
      { author: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { level: { $regex: search, $options: "i" } },
    ];
  }

  return query;
}

async function searchBooks(command: SearchBooksCommand): Promise<SearchBooksResponse> {
  const books = getCollection<BookDocument>(BookCollection);
  const safePage = Math.max(1, Math.floor(Number(command.page || 1)));
  const safePageSize = Math.max(1, Math.min(50, Math.floor(Number(command.pageSize || 8))));
  const skip = (safePage - 1) * safePageSize;
  const query = buildBookQuery({
    name: normalizeValue(command.name),
    category: normalizeValue(command.category),
    level: normalizeValue(command.level),
    author: normalizeValue(command.author),
    q: normalizeValue(command.q),
  });

  const [items, total] = await Promise.all([
    books.find(query).skip(skip).limit(safePageSize).toArray(),
    books.countDocuments(query),
  ]);

  return {
    items: items.map(sanitizeBookSummary),
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

async function getBookById(bookId: ObjectId) {
  const books = getCollection<BookDocument>(BookCollection);
  const book = await books.findOne({ _id: bookId });

  if (!book) {
    const error = new Error("Book not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  return sanitizeBookSummary(book);
}

async function getBookBySlug(slug: string) {
  const books = getCollection<BookDocument>(BookCollection);
  const book = await books.findOne({ slug });

  if (!book) {
    const error = new Error("Book not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  return sanitizeBookSummary(book);
}

function sanitizeBookSummary(book: BookDocument) {
  return {
    id: book._id?.toString() || null,
    title: book.title,
    slug: book.slug,
    author: book.author,
    description: book.description,
    officialSite: book.officialSite,
    category: book.category || "",
    level: book.level || "",
    createdAt: book.createdAt || null,
    updatedAt: book.updatedAt || null,
  };
}

export { searchBooks, getBookById, getBookBySlug };
