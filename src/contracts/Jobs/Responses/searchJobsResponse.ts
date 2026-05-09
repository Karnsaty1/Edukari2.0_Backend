import type { PaginatedResult } from "../../Pagination/Dtos/pagination";
import type { Job } from "../Dtos/job";

export interface SearchJobsResponse extends PaginatedResult<Job> {
  filters: {
    country: string;
    location: string | null;
    type: string | null;
    level: string | null;
    locationType: string | null;
  };
}
