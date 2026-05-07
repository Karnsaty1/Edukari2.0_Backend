import type { PaginationCommand } from "../../Pagination/Dtos/pagination";

export interface SearchLiveRoomLogsCommand extends PaginationCommand {
  q?: string | null;
  status?: "draft" | "scheduled" | "live" | "ended" | null;
  courseId?: string | null;
  hostUserId?: string | null;
  isPublic?: boolean | null;
  from?: string | null;  // ISO date — filter by createdAt range
  to?: string | null;
}
