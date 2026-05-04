import type {
  LiveAttendance,
  LiveMessage,
  LiveParticipant,
  LiveRoom,
  LiveSession,
} from "../Dtos/live";

export interface LiveRoomDetailResponse {
  room: LiveRoom;
  latestSession: LiveSession | null;
  counts: {
    participants: number;
    activeParticipants: number;
    messages: number;
    attendance: number;
  };
  recentParticipants: LiveParticipant[];
  recentMessages: LiveMessage[];
  recentAttendance: LiveAttendance[];
}
