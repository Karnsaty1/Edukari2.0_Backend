import { ObjectId } from "mongodb";
import { randomUUID } from "node:crypto";
import { getCollection } from "../../config/db";
import { getLiveKitUrl, buildLiveKitToken } from "./live.media";
import {
  LiveAttendanceCollection,
  LiveMessageCollection,
  LiveParticipantCollection,
  LiveReactionCollection,
  LiveRoomCollection,
  LiveSessionCollection,
  type LiveParticipantRole,
  type LiveRoom,
  type LiveSession,
  type LiveParticipant,
  type LiveMessage,
  type LiveAttendance,
  type LiveReaction,
} from "../../contracts/Live/Dtos/live";
import type { CreateLiveRoomCommand } from "../../contracts/Live/Commands/createLiveRoomCommand";
import type { SearchLiveRoomLogsCommand } from "../../contracts/Live/Commands/searchLiveRoomLogsCommand";
import type { SearchLiveRoomsCommand } from "../../contracts/Live/Commands/searchLiveRoomsCommand";
import type { DetailLiveRoomCommand } from "../../contracts/Live/Commands/detailLiveRoomCommand";
import type { SendLiveMessageCommand } from "../../contracts/Live/Commands/sendLiveMessageCommand";
import type { RecordLiveAttendanceCommand } from "../../contracts/Live/Commands/recordLiveAttendanceCommand";
import type { SendLiveReactionCommand } from "../../contracts/Live/Commands/sendLiveReactionCommand";

type OmitStringIds<T> = Omit<T, "id" | "roomId" | "userId" | "hostUserId" | "courseId">;

type MongoDoc<T extends OmitStringIds<T>> = OmitStringIds<T> & {
  _id?: ObjectId;
  roomId?: ObjectId;
  userId?: ObjectId;
  hostUserId?: ObjectId;
  courseId?: ObjectId | null;
};

type LiveRoomDocument = MongoDoc<LiveRoom>;
type LiveSessionDocument = MongoDoc<LiveSession>;
type LiveParticipantDocument = MongoDoc<LiveParticipant>;
type LiveMessageDocument = MongoDoc<LiveMessage>;
type LiveAttendanceDocument = MongoDoc<LiveAttendance>;
type LiveReactionDocument = MongoDoc<LiveReaction>;

type LiveRoomSummary = ReturnType<typeof sanitizeLiveRoom>;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(value?: string | null): string {
  return String(value || "").trim();
}

function toObjectId(value?: string | null): ObjectId | null {
  if (!value) {
    return null;
  }

  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}

function sanitizeLiveRoom(room: LiveRoomDocument) {
  return {
    id: room._id?.toString() || null,
    title: room.title,
    slug: room.slug,
    description: room.description || "",
    courseId: room.courseId?.toString() || null,
    hostUserId: room.hostUserId?.toString?.() || "",
    status: room.status,
    provider: room.provider,
    providerRoomName: room.providerRoomName,
    scheduledStartAt: room.scheduledStartAt || null,
    startedAt: room.startedAt || null,
    endedAt: room.endedAt || null,
    maxAttendees: room.maxAttendees ?? null,
    isPublic: room.isPublic ?? true,
    createdAt: room.createdAt || null,
    updatedAt: room.updatedAt || null,
  };
}

function sanitizeLiveSession(session: LiveSessionDocument) {
  return {
    id: session._id?.toString() || null,
    roomId: session.roomId?.toString?.() || "",
    provider: session.provider,
    providerRoomName: session.providerRoomName,
    status: session.status,
    startedAt: session.startedAt || null,
    endedAt: session.endedAt || null,
    createdAt: session.createdAt || null,
    updatedAt: session.updatedAt || null,
  };
}

function sanitizeLiveParticipant(participant: LiveParticipantDocument) {
  return {
    id: participant._id?.toString() || null,
    roomId: participant.roomId?.toString?.() || "",
    userId: participant.userId?.toString?.() || "",
    role: participant.role,
    displayName: participant.displayName,
    isActive: participant.isActive,
    joinedAt: participant.joinedAt || null,
    leftAt: participant.leftAt || null,
    lastSeenAt: participant.lastSeenAt || null,
    createdAt: participant.createdAt || null,
    updatedAt: participant.updatedAt || null,
  };
}

function sanitizeLiveMessage(message: LiveMessageDocument) {
  return {
    id: message._id?.toString() || null,
    roomId: message.roomId?.toString?.() || "",
    userId: message.userId?.toString?.() || "",
    displayName: message.displayName,
    kind: message.kind,
    text: message.text,
    createdAt: message.createdAt || null,
    updatedAt: message.updatedAt || null,
  };
}

function sanitizeLiveAttendance(attendance: LiveAttendanceDocument) {
  return {
    id: attendance._id?.toString() || null,
    roomId: attendance.roomId?.toString?.() || "",
    userId: attendance.userId?.toString?.() || "",
    displayName: attendance.displayName,
    watchSeconds: attendance.watchSeconds,
    isPresent: attendance.isPresent,
    joinedAt: attendance.joinedAt || null,
    leftAt: attendance.leftAt || null,
    lastHeartbeatAt: attendance.lastHeartbeatAt || null,
    createdAt: attendance.createdAt || null,
    updatedAt: attendance.updatedAt || null,
  };
}

function sanitizeLiveReaction(reaction: LiveReactionDocument) {
  return {
    id: reaction._id?.toString() || null,
    roomId: reaction.roomId?.toString?.() || "",
    userId: reaction.userId?.toString?.() || "",
    displayName: reaction.displayName,
    type: reaction.type,
    createdAt: reaction.createdAt || null,
    updatedAt: reaction.updatedAt || null,
  };
}

function buildRoomQuery(filters: SearchLiveRoomsCommand) {
  const query: Record<string, unknown> = {};
  const q = normalizeText(filters.q);
  const status = normalizeText(filters.status);
  const courseId = normalizeText(filters.courseId);
  const hostUserId = normalizeText(filters.hostUserId);

  if (q) {
    query.$or = [
      { title: { $regex: escapeRegex(q), $options: "i" } },
      { slug: { $regex: escapeRegex(q), $options: "i" } },
      { description: { $regex: escapeRegex(q), $options: "i" } },
    ];
  }

  if (status) {
    query.status = status;
  } else {
    query.status = { $ne: "ended" };
  }

  if (courseId) {
    const objectId = toObjectId(courseId);
    if (objectId) {
      query.courseId = objectId;
    }
  }

  if (hostUserId) {
    const objectId = toObjectId(hostUserId);
    if (objectId) {
      query.hostUserId = objectId;
    }
  }

  if (typeof filters.isPublic === "boolean") {
    query.isPublic = filters.isPublic;
  }

  return query;
}

function createSlug(title: string): string {
  const base = normalizeText(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "live-room"}-${randomUUID().slice(0, 8)}`;
}

async function createLiveRoom(
  command: CreateLiveRoomCommand,
  hostUserId: ObjectId
) {
  const rooms = getCollection<LiveRoomDocument>(LiveRoomCollection);
  const now = new Date();
  const title = normalizeText(command.title);
  if (!title) {
    throw Object.assign(new Error("title is required"), { statusCode: 400 });
  }

  const slug = normalizeText(command.slug) || createSlug(title);
  const existing = await rooms.findOne({ slug });

  if (existing) {
    const error = new Error("Live room slug already exists");
    (error as Error & { statusCode?: number }).statusCode = 409;
    throw error;
  }

  const roomDocument: Omit<LiveRoomDocument, "_id"> = {
    title,
    slug,
    description: normalizeText(command.description),
    courseId: toObjectId(command.courseId),
    hostUserId,
    status: command.scheduledStartAt ? "scheduled" : "draft",
    provider: "livekit",
    providerRoomName: slug,
    scheduledStartAt: command.scheduledStartAt ? new Date(command.scheduledStartAt) : null,
    startedAt: null,
    endedAt: null,
    maxAttendees: typeof command.maxAttendees === "number" ? command.maxAttendees : 300,
    isPublic: command.isPublic ?? true,
    createdAt: now,
    updatedAt: now,
  };

  const result = await rooms.insertOne(roomDocument);
  const room = await rooms.findOne({ _id: result.insertedId });

  if (!room) {
    throw Object.assign(new Error("Unable to load created live room"), {
      statusCode: 500,
    });
  }

  await joinLiveRoom(result.insertedId, hostUserId, normalizeText(command.displayName) || "Host", "host");

  return sanitizeLiveRoom(room);
}

async function searchLiveRooms(command: SearchLiveRoomsCommand) {
  const rooms = getCollection<LiveRoomDocument>(LiveRoomCollection);
  const safePage = Math.max(1, Math.floor(Number(command.page || 1)));
  const safePageSize = Math.max(1, Math.min(50, Math.floor(Number(command.pageSize || 8))));
  const skip = (safePage - 1) * safePageSize;
  const query = buildRoomQuery(command);

  const [items, total] = await Promise.all([
    rooms.find(query).sort({ createdAt: -1 }).skip(skip).limit(safePageSize).toArray(),
    rooms.countDocuments(query),
  ]);

  return {
    items: items.map(sanitizeLiveRoom),
    meta: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
      hasNext: skip + safePageSize < total,
      hasPrev: safePage > 1,
    },
  };
}

async function getLiveRoomDetail(command: DetailLiveRoomCommand) {
  const rooms = getCollection<LiveRoomDocument>(LiveRoomCollection);
  const sessions = getCollection<LiveSessionDocument>(LiveSessionCollection);
  const participants = getCollection<LiveParticipantDocument>(LiveParticipantCollection);
  const messages = getCollection<LiveMessageDocument>(LiveMessageCollection);
  const attendance = getCollection<LiveAttendanceDocument>(LiveAttendanceCollection);

  const roomId = toObjectId(command.roomId || null);
  let room: LiveRoomDocument | null = null;

  if (roomId) {
    room = await rooms.findOne({ _id: roomId });
  } else if (command.slug) {
    room = await rooms.findOne({ slug: normalizeText(command.slug) });
  }

  if (!room) {
    const error = new Error("Live room not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  const [latestSession, recentParticipants, recentMessages, recentAttendance, counts] =
    await Promise.all([
      sessions.findOne({ roomId: room._id as ObjectId }, { sort: { createdAt: -1 } }),
      participants.find({ roomId: room._id as ObjectId }).sort({ updatedAt: -1 }).limit(20).toArray(),
      messages.find({ roomId: room._id as ObjectId }).sort({ createdAt: -1 }).limit(20).toArray(),
      attendance.find({ roomId: room._id as ObjectId }).sort({ updatedAt: -1 }).limit(20).toArray(),
      Promise.all([
        participants.countDocuments({ roomId: room._id as ObjectId }),
        participants.countDocuments({ roomId: room._id as ObjectId, isActive: true }),
        messages.countDocuments({ roomId: room._id as ObjectId }),
        attendance.countDocuments({ roomId: room._id as ObjectId }),
      ]),
    ]);

  const [participantCount, activeParticipantCount, messageCount, attendanceCount] = counts;

  return {
    room: sanitizeLiveRoom(room),
    latestSession: latestSession ? sanitizeLiveSession(latestSession) : null,
    counts: {
      participants: participantCount,
      activeParticipants: activeParticipantCount,
      messages: messageCount,
      attendance: attendanceCount,
    },
    recentParticipants: recentParticipants.map(sanitizeLiveParticipant),
    recentMessages: recentMessages.map(sanitizeLiveMessage),
    recentAttendance: recentAttendance.map(sanitizeLiveAttendance),
  };
}

async function startLiveSession(roomId: ObjectId, userId: ObjectId, displayName: string) {
  const rooms = getCollection<LiveRoomDocument>(LiveRoomCollection);
  const sessions = getCollection<LiveSessionDocument>(LiveSessionCollection);

  const room = await rooms.findOne({ _id: roomId });
  if (!room) {
    const error = new Error("Live room not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  if (room.hostUserId && room.hostUserId.toString() !== userId.toString()) {
    const error = new Error("Only the host can start a live session");
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  const now = new Date();

  await rooms.updateOne(
    { _id: roomId },
    {
      $set: {
        status: "live" as LiveRoom["status"],
        startedAt: room.startedAt || now,
        endedAt: null,
        updatedAt: now,
      },
    }
  );

  const sessionDocument: Omit<LiveSessionDocument, "_id"> = {
    roomId,
    provider: "livekit",
    providerRoomName: room.providerRoomName,
    status: "live",
    startedAt: now,
    endedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await sessions.insertOne(sessionDocument);
  const session = await sessions.findOne({ _id: insertResult.insertedId });

  if (!session) {
    throw Object.assign(new Error("Unable to load live session"), {
      statusCode: 500,
    });
  }

  const token = await buildLiveKitToken({
    roomName: room.providerRoomName,
    userId: userId.toString(),
    displayName,
    role: "host",
  });

  return {
    room: sanitizeLiveRoom((await rooms.findOne({ _id: roomId })) as LiveRoomDocument),
    session: sanitizeLiveSession(session),
    token,
    livekitUrl: getLiveKitUrl() || null,
  };
}

async function endLiveSession(roomId: ObjectId, userId: ObjectId) {
  const rooms = getCollection<LiveRoomDocument>(LiveRoomCollection);
  const sessions = getCollection<LiveSessionDocument>(LiveSessionCollection);

  const room = await rooms.findOne({ _id: roomId });
  if (!room) {
    const error = new Error("Live room not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  if (room.hostUserId && room.hostUserId.toString() !== userId.toString()) {
    const error = new Error("Only the host can end a live session");
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }

  const now = new Date();
  await rooms.updateOne(
    { _id: roomId },
    {
      $set: {
        status: "ended" as LiveRoom["status"],
        endedAt: now,
        updatedAt: now,
      },
    }
  );

  await sessions.updateOne(
    { roomId, status: "live" },
    {
      $set: {
        status: "ended",
        endedAt: now,
        updatedAt: now,
      },
    }
  );

  const updatedRoom = await rooms.findOne({ _id: roomId });
  const latestSession = await sessions.findOne({ roomId }, { sort: { createdAt: -1 } });

  if (!updatedRoom || !latestSession) {
    const error = new Error("Unable to finalize live session");
    (error as Error & { statusCode?: number }).statusCode = 500;
    throw error;
  }

  return {
    room: sanitizeLiveRoom(updatedRoom),
    session: sanitizeLiveSession(latestSession),
  };
}

async function joinLiveRoom(
  roomId: ObjectId,
  userId: ObjectId,
  displayName: string,
  role: LiveParticipantRole
) {
  const rooms = getCollection<LiveRoomDocument>(LiveRoomCollection);
  const sessions = getCollection<LiveSessionDocument>(LiveSessionCollection);
  const participants = getCollection<LiveParticipantDocument>(LiveParticipantCollection);
  const attendance = getCollection<LiveAttendanceDocument>(LiveAttendanceCollection);

  const room = await rooms.findOne({ _id: roomId });
  if (!room) {
    const error = new Error("Live room not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  const resolvedRole: LiveParticipantRole = room.hostUserId?.toString() === userId.toString() ? "host" : role;
  const now = new Date();
  const participantDocument: Partial<LiveParticipantDocument> = {
    roomId,
    userId,
    role: resolvedRole,
    displayName,
    isActive: true,
    joinedAt: now,
    leftAt: null,
    lastSeenAt: now,
    updatedAt: now,
  };

  await participants.updateOne(
    { roomId, userId },
    {
      $set: participantDocument,
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  await attendance.updateOne(
    { roomId, userId },
    {
      $set: {
        roomId,
        userId,
        displayName,
        isPresent: true,
        joinedAt: now,
        leftAt: null,
        lastHeartbeatAt: now,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
        watchSeconds: 0,
      },
    },
    { upsert: true }
  );

  const session = await sessions.findOne({ roomId }, { sort: { createdAt: -1 } });
  const token = await buildLiveKitToken({
    roomName: room.providerRoomName,
    userId: userId.toString(),
    displayName,
    role: resolvedRole,
  });

  return {
    room: sanitizeLiveRoom(room),
    session: session ? sanitizeLiveSession(session) : null,
    token,
    livekitUrl: getLiveKitUrl() || null,
    role: resolvedRole,
  };
}

async function leaveLiveRoom(roomId: ObjectId, userId: ObjectId) {
  const participants = getCollection<LiveParticipantDocument>(LiveParticipantCollection);
  const attendance = getCollection<LiveAttendanceDocument>(LiveAttendanceCollection);
  const now = new Date();

  await participants.updateOne(
    { roomId, userId },
    {
      $set: {
        isActive: false,
        leftAt: now,
        lastSeenAt: now,
        updatedAt: now,
      },
    }
  );

  await attendance.updateOne(
    { roomId, userId },
    {
      $set: {
        isPresent: false,
        leftAt: now,
        lastHeartbeatAt: now,
        updatedAt: now,
      },
    }
  );

  const participant = await participants.findOne({ roomId, userId });
  const record = await attendance.findOne({ roomId, userId });

  return {
    participant: participant ? sanitizeLiveParticipant(participant) : null,
    attendance: record ? sanitizeLiveAttendance(record) : null,
  };
}

async function sendLiveMessage(
  roomId: ObjectId,
  userId: ObjectId,
  displayName: string,
  command: SendLiveMessageCommand
) {
  const messages = getCollection<LiveMessageDocument>(LiveMessageCollection);
  const now = new Date();
  const text = normalizeText(command.text);

  if (!text) {
    const error = new Error("text is required");
    (error as Error & { statusCode?: number }).statusCode = 400;
    throw error;
  }

  const kind = command.kind || "message";
  const messageDocument: Omit<LiveMessageDocument, "_id"> = {
    roomId,
    userId,
    displayName,
    kind,
    text,
    createdAt: now,
    updatedAt: now,
  };

  const result = await messages.insertOne(messageDocument);
  const message = await messages.findOne({ _id: result.insertedId });

  if (!message) {
    throw Object.assign(new Error("Unable to load live message"), {
      statusCode: 500,
    });
  }

  return sanitizeLiveMessage(message);
}

async function recordLiveAttendance(
  roomId: ObjectId,
  userId: ObjectId,
  displayName: string,
  command: RecordLiveAttendanceCommand
) {
  const attendance = getCollection<LiveAttendanceDocument>(LiveAttendanceCollection);
  const now = new Date();
  const increment = Math.max(0, Math.floor(Number(command.watchSeconds || 0)));

  await attendance.updateOne(
    { roomId, userId },
    {
      $set: {
        roomId,
        userId,
        displayName,
        isPresent: command.isPresent ?? true,
        lastHeartbeatAt: now,
        updatedAt: now,
      },
      $inc: {
        watchSeconds: increment,
      },
      $setOnInsert: {
        createdAt: now,
        joinedAt: now,
        leftAt: null,
      },
    },
    { upsert: true }
  );

  const record = await attendance.findOne({ roomId, userId });
  if (!record) {
    throw Object.assign(new Error("Unable to load attendance record"), {
      statusCode: 500,
    });
  }

  return sanitizeLiveAttendance(record);
}

async function sendLiveReaction(
  roomId: ObjectId,
  userId: ObjectId,
  displayName: string,
  command: SendLiveReactionCommand
) {
  const reactions = getCollection<LiveReactionDocument>(LiveReactionCollection);
  const now = new Date();
  const reactionDocument: Omit<LiveReactionDocument, "_id"> = {
    roomId,
    userId,
    displayName,
    type: command.type as LiveReaction["type"],
    createdAt: now,
    updatedAt: now,
  };

  const result = await reactions.insertOne(reactionDocument);
  const reaction = await reactions.findOne({ _id: result.insertedId });

  if (!reaction) {
    throw Object.assign(new Error("Unable to load live reaction"), {
      statusCode: 500,
    });
  }

  return sanitizeLiveReaction(reaction);
}

async function searchLiveRoomLogs(command: SearchLiveRoomLogsCommand) {
  const rooms = getCollection<LiveRoomDocument>(LiveRoomCollection);
  const participants = getCollection<LiveParticipantDocument>(LiveParticipantCollection);
  const messages = getCollection<LiveMessageDocument>(LiveMessageCollection);
  const attendance = getCollection<LiveAttendanceDocument>(LiveAttendanceCollection);

  const safePage = Math.max(1, Math.floor(Number(command.page || 1)));
  const safePageSize = Math.max(1, Math.min(50, Math.floor(Number(command.pageSize || 10))));
  const skip = (safePage - 1) * safePageSize;
  const query = buildRoomQuery(command);

  if (command.from || command.to) {
    const dateFilter: Record<string, Date> = {};
    if (command.from) dateFilter.$gte = new Date(command.from);
    if (command.to) dateFilter.$lte = new Date(command.to);
    query.createdAt = dateFilter;
  }

  const [items, total] = await Promise.all([
    rooms.find(query).sort({ createdAt: -1 }).skip(skip).limit(safePageSize).toArray(),
    rooms.countDocuments(query),
  ]);

  const logs = await Promise.all(
    items.map(async (room) => {
      const roomId = room._id as ObjectId;
      const [totalParticipants, totalMessages, totalAttendance] = await Promise.all([
        participants.countDocuments({ roomId }),
        messages.countDocuments({ roomId }),
        attendance.countDocuments({ roomId }),
      ]);
      return {
        ...sanitizeLiveRoom(room),
        totalParticipants,
        totalMessages,
        totalAttendance,
      };
    })
  );

  return {
    items: logs,
    meta: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
      hasNext: skip + safePageSize < total,
      hasPrev: safePage > 1,
    },
  };
}

async function getLiveRoomLogDetail(roomId: ObjectId) {
  const rooms = getCollection<LiveRoomDocument>(LiveRoomCollection);
  const sessions = getCollection<LiveSessionDocument>(LiveSessionCollection);
  const participants = getCollection<LiveParticipantDocument>(LiveParticipantCollection);
  const messages = getCollection<LiveMessageDocument>(LiveMessageCollection);
  const attendance = getCollection<LiveAttendanceDocument>(LiveAttendanceCollection);

  const room = await rooms.findOne({ _id: roomId });
  if (!room) {
    const error = new Error("Live room not found");
    (error as Error & { statusCode?: number }).statusCode = 404;
    throw error;
  }

  const [allSessions, allParticipants, recentMessages, recentAttendance, counts] =
    await Promise.all([
      sessions.find({ roomId }).sort({ createdAt: -1 }).toArray(),
      participants.find({ roomId }).sort({ joinedAt: -1 }).toArray(),
      messages.find({ roomId }).sort({ createdAt: -1 }).limit(50).toArray(),
      attendance.find({ roomId }).sort({ updatedAt: -1 }).toArray(),
      Promise.all([
        sessions.countDocuments({ roomId }),
        participants.countDocuments({ roomId }),
        messages.countDocuments({ roomId }),
        attendance.countDocuments({ roomId }),
      ]),
    ]);

  const [sessionCount, participantCount, messageCount, attendanceCount] = counts;

  return {
    room: {
      ...sanitizeLiveRoom(room),
      totalParticipants: participantCount,
      totalMessages: messageCount,
      totalAttendance: attendanceCount,
    },
    sessions: allSessions.map(sanitizeLiveSession),
    participants: allParticipants.map(sanitizeLiveParticipant),
    recentMessages: recentMessages.map(sanitizeLiveMessage),
    recentAttendance: recentAttendance.map(sanitizeLiveAttendance),
    counts: {
      sessions: sessionCount,
      participants: participantCount,
      messages: messageCount,
      attendance: attendanceCount,
    },
  };
}

async function getRoomParticipantCounts(roomId: ObjectId) {
  const participants = getCollection<LiveParticipantDocument>(LiveParticipantCollection);

  const [total, active, left] = await Promise.all([
    participants.countDocuments({ roomId }),
    participants.countDocuments({ roomId, isActive: true }),
    participants.countDocuments({ roomId, isActive: false }),
  ]);

  return { total, active, left };
}

async function getLatestLiveSession(roomId: ObjectId) {
  const sessions = getCollection<LiveSessionDocument>(LiveSessionCollection);
  const session = await sessions.findOne({ roomId }, { sort: { createdAt: -1 } });
  return session ? sanitizeLiveSession(session) : null;
}

async function searchRoomMessages(roomId: ObjectId, page = 1, pageSize = 20) {
  const messages = getCollection<LiveMessageDocument>(LiveMessageCollection);
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.min(100, Math.floor(pageSize)));
  const skip = (safePage - 1) * safePageSize;

  const [items, total] = await Promise.all([
    messages.find({ roomId }).sort({ createdAt: -1 }).skip(skip).limit(safePageSize).toArray(),
    messages.countDocuments({ roomId }),
  ]);

  return {
    items: items.map(sanitizeLiveMessage),
    meta: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
      hasNext: skip + safePageSize < total,
      hasPrev: safePage > 1,
    },
  };
}

export {
  createLiveRoom,
  searchLiveRooms,
  getLiveRoomDetail,
  startLiveSession,
  endLiveSession,
  joinLiveRoom,
  leaveLiveRoom,
  sendLiveMessage,
  recordLiveAttendance,
  sendLiveReaction,
  getLatestLiveSession,
  searchRoomMessages,
  getRoomParticipantCounts,
  searchLiveRoomLogs,
  getLiveRoomLogDetail,
  sanitizeLiveRoom,
  sanitizeLiveSession,
  sanitizeLiveParticipant,
  sanitizeLiveMessage,
  sanitizeLiveAttendance,
  sanitizeLiveReaction,
};
