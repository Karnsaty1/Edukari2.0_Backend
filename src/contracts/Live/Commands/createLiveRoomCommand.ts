export interface CreateLiveRoomCommand {
  title: string;
  description?: string | null;
  courseId?: string | null;
  scheduledStartAt?: string | null;
  maxAttendees?: number | null;
  isPublic?: boolean | null;
  slug?: string | null;
  displayName?: string | null;
}
