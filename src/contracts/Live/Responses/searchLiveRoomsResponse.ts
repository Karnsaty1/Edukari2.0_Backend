import type { PaginatedResult } from "../../Pagination/Dtos/pagination";
import type { LiveRoom } from "../Dtos/live";

export interface SearchLiveRoomsResponse extends PaginatedResult<LiveRoom> {}
