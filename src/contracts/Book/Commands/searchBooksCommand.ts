import type { PaginationCommand } from "../../Pagination/Dtos/pagination";

export interface SearchBooksCommand extends PaginationCommand {
  name?: string | null;
  category?: string | null;
  level?: string | null;
  author?: string | null;
  q?: string | null;
}
