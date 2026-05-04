import type { PaginationCommand } from "../../Pagination/Dtos/pagination";

export interface SearchLiveRoomsCommand extends PaginationCommand {
  q?: string | null;
  status?: "draft" | "scheduled" | "live" | "ended" | null;
  courseId?: string | null;
  hostUserId?: string | null;
  isPublic?: boolean | null;
}
