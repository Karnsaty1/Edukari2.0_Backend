export interface JoinLiveRoomCommand {
  displayName?: string | null;
  role?: "host" | "teacher" | "moderator" | "attendee" | null;
}
