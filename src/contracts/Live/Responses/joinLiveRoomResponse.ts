import type { LiveRoom, LiveSession } from "../Dtos/live";

export interface JoinLiveRoomResponse {
  room: LiveRoom;
  session: LiveSession | null;
  token: string | null;
  livekitUrl: string | null;
  role: string;
}
