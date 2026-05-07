import type { PaginatedResult } from "../../Pagination/Dtos/pagination";
import type { LiveRoomLog } from "../Dtos/liveLog";
import type { LiveSession, LiveParticipant, LiveMessage, LiveAttendance } from "../Dtos/live";

export interface SearchLiveRoomLogsResponse extends PaginatedResult<LiveRoomLog> {}

export interface LiveRoomLogDetailResponse {
  room: LiveRoomLog;
  sessions: LiveSession[];
  participants: LiveParticipant[];
  recentMessages: LiveMessage[];
  recentAttendance: LiveAttendance[];
  counts: {
    sessions: number;
    participants: number;
    messages: number;
    attendance: number;
  };
}
