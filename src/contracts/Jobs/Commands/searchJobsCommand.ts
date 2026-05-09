import type { PaginationCommand } from "../../Pagination/Dtos/pagination";
import type { JobType, JobLevel, JobLocationType } from "../Dtos/job";

export interface SearchJobsCommand extends PaginationCommand {
  q?: string | null;                  // keyword search
  location?: string | null;           // city, region or country
  country?: string | null;            // ISO 2-letter code e.g. "in", "us", "gb" — default "in"
  type?: JobType | null;              // full-time, internship, etc.
  level?: JobLevel | null;            // entry, mid, senior, etc.
  locationType?: JobLocationType | null; // remote, hybrid, onsite
  salaryMin?: number | null;
  salaryMax?: number | null;
  company?: string | null;
  tags?: string[] | null;             // filter by skills/keywords
  postedWithinDays?: number | null;   // e.g. 7 = last 7 days
}
