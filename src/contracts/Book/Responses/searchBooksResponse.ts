import type { PaginatedResult } from "../../Pagination/Dtos/pagination";
import type { Book } from "../Dtos/book";

export interface SearchBooksResponse extends PaginatedResult<Book> {}
