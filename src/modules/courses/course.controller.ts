import type { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import {
  listCourses,
  getCourseById,
  getCourseBySlug,
  getCourseQuizById,
} from "./course.service";

function asParamValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 8);
    const result = await listCourses(page, pageSize);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = asParamValue(req.params.courseId);
    const result = await getCourseById(new ObjectId(courseId));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function bySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = asParamValue(req.params.slug);
    const result = await getCourseBySlug(slug);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function quiz(req: Request, res: Response, next: NextFunction) {
  try {
    const courseId = asParamValue(req.params.courseId);
    const result = await getCourseQuizById(new ObjectId(courseId));
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export { list, detail, bySlug, quiz };
