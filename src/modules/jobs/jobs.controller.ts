import type { NextFunction, Request, Response } from "express";
import { searchJobs } from "./jobs.service";

async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await searchJobs(req.body || {});
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export { search };
