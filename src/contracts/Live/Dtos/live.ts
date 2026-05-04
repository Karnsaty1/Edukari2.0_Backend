import type { ObjectId } from "mongodb";

export type LiveRoomStatus = "draft" | "scheduled" | "live" | "ended";
export type LiveParticipantRole = "host" | "teacher" | "moderator" | "attendee";
export type LiveSessionStatus = "live" | "ended";
export type LiveMessageKind = "message" | "announcement";
export type LiveReactionType = "like" | "clap" | "heart" | "hand" | "laugh" | "wow";
export type LiveProvider = "livekit";

export interface LiveRoom {
  id?: string | null;
  _id?: ObjectId | null;
  title: string;
  slug: string;
  description?: string;
  courseId?: string | null;
  hostUserId: string;
  status: LiveRoomStatus;
  provider: LiveProvider;
  providerRoomName: string;
  scheduledStartAt?: Date | null;
  startedAt?: Date | null;
  endedAt?: Date | null;
  maxAttendees?: number | null;
  isPublic?: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface LiveSession {
  id?: string | null;
  _id?: ObjectId | null;
  roomId: string;
  provider: LiveProvider;
  providerRoomName: string;
  status: LiveSessionStatus;
  startedAt?: Date | null;
  endedAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface LiveParticipant {
  id?: string | null;
  _id?: ObjectId | null;
  roomId: string;
  userId: string;
  role: LiveParticipantRole;
  displayName: string;
  isActive: boolean;
  joinedAt?: Date | null;
  leftAt?: Date | null;
  lastSeenAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface LiveMessage {
  id?: string | null;
  _id?: ObjectId | null;
  roomId: string;
  userId: string;
  displayName: string;
  kind: LiveMessageKind;
  text: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface LiveAttendance {
  id?: string | null;
  _id?: ObjectId | null;
  roomId: string;
  userId: string;
  displayName: string;
  watchSeconds: number;
  isPresent: boolean;
  joinedAt?: Date | null;
  leftAt?: Date | null;
  lastHeartbeatAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface LiveReaction {
  id?: string | null;
  _id?: ObjectId | null;
  roomId: string;
  userId: string;
  displayName: string;
  type: LiveReactionType;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export const LiveRoomCollection = "liveRooms" as const;
export const LiveSessionCollection = "liveSessions" as const;
export const LiveParticipantCollection = "liveParticipants" as const;
export const LiveMessageCollection = "liveMessages" as const;
export const LiveAttendanceCollection = "liveAttendance" as const;
export const LiveReactionCollection = "liveReactions" as const;

export const LiveRoomFields = {
  id: "id",
  title: "title",
  slug: "slug",
  description: "description",
  courseId: "courseId",
  hostUserId: "hostUserId",
  status: "status",
  provider: "provider",
  providerRoomName: "providerRoomName",
  scheduledStartAt: "scheduledStartAt",
  startedAt: "startedAt",
  endedAt: "endedAt",
  maxAttendees: "maxAttendees",
  isPublic: "isPublic",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
} as const;

export const LiveSessionFields = {
  id: "id",
  roomId: "roomId",
  provider: "provider",
  providerRoomName: "providerRoomName",
  status: "status",
  startedAt: "startedAt",
  endedAt: "endedAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
} as const;

export const LiveParticipantFields = {
  id: "id",
  roomId: "roomId",
  userId: "userId",
  role: "role",
  displayName: "displayName",
  isActive: "isActive",
  joinedAt: "joinedAt",
  leftAt: "leftAt",
  lastSeenAt: "lastSeenAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
} as const;

export const LiveMessageFields = {
  id: "id",
  roomId: "roomId",
  userId: "userId",
  displayName: "displayName",
  kind: "kind",
  text: "text",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
} as const;

export const LiveAttendanceFields = {
  id: "id",
  roomId: "roomId",
  userId: "userId",
  displayName: "displayName",
  watchSeconds: "watchSeconds",
  isPresent: "isPresent",
  joinedAt: "joinedAt",
  leftAt: "leftAt",
  lastHeartbeatAt: "lastHeartbeatAt",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
} as const;

export const LiveReactionFields = {
  id: "id",
  roomId: "roomId",
  userId: "userId",
  displayName: "displayName",
  type: "type",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
} as const;
