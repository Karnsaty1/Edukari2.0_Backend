import type { LiveRoom, LiveSession } from "../Dtos/live";

export interface StartLiveSessionResponse {
  room: LiveRoom;
  session: LiveSession;
  token: string | null;
  livekitUrl: string | null;
}
