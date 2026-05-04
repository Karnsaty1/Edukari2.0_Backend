import type { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getBookById, getBookBySlug, searchBooks } from "./book.service";

function asParamValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await searchBooks(req.body || {});
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const bookId = asParamValue(req.body?.bookId || req.params.bookId);
    const result = await getBookById(new ObjectId(bookId));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function bySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = asParamValue(req.body?.slug || req.params.slug);
    const result = await getBookBySlug(slug);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export { search, detail, bySlug };
