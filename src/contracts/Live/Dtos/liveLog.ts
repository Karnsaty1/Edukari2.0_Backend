import type { LiveRoomStatus } from "./live";

export interface LiveRoomLog {
  id: string;
  title: string;
  slug: string;
  description: string;
  courseId: string | null;
  hostUserId: string;
  status: LiveRoomStatus;
  provider: string;
  providerRoomName: string;
  scheduledStartAt: Date | null;
  startedAt: Date | null;
  endedAt: Date | null;
  maxAttendees: number | null;
  isPublic: boolean;
  totalParticipants: number;
  totalMessages: number;
  totalAttendance: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}
