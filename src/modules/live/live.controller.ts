import type { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import type { LiveParticipantRole } from "../../contracts/Live/Dtos/live";
import {
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
  searchRoomMessages,
  getRoomParticipantCounts,
  searchLiveRoomLogs,
  getLiveRoomLogDetail,
} from "./live.service";
import { emitRoomEnded } from "./live.socket";

function asParamValue(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function parseObjectId(value: string | string[] | undefined, fieldName = "id"): ObjectId {
  const raw = asParamValue(value);

  if (!raw) {
    throw Object.assign(new Error(`${fieldName} is required`), {
      statusCode: 400,
    });
  }

  try {
    return new ObjectId(raw);
  } catch {
    throw Object.assign(new Error(`${fieldName} must be a valid ObjectId`), {
      statusCode: 400,
    });
  }
}

function getAuthedUser(req: Request): { sub?: string; firstname?: string; email?: string } {
  return (
    (req as Request & { user?: { sub?: string; firstname?: string; email?: string } }).user ||
    {}
  );
}

function getAuthedUserId(req: Request): ObjectId {
  const user = getAuthedUser(req);

  if (!user.sub) {
    throw Object.assign(new Error("Authorization token is required"), {
      statusCode: 401,
    });
  }

  return new ObjectId(user.sub);
}

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthedUser(req);
    const userId = getAuthedUserId(req);
    const displayName = req.body?.displayName || user.firstname || user.email || "Host";
    const result = await createLiveRoom({ ...req.body, displayName }, userId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getAuthedUserId(req);
    const result = await searchLiveRooms(req.body || {}, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getLiveRoomDetail(req.body || {});
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function goLive(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthedUser(req);
    const userId = getAuthedUserId(req);
    const roomId = parseObjectId(req.params.roomId || req.body?.roomId, "roomId");
    const displayName = user.firstname || user.email || "Host";
    const result = await startLiveSession(roomId, userId, displayName);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function endLive(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getAuthedUserId(req);
    const roomId = parseObjectId(req.params.roomId || req.body?.roomId, "roomId");
    const result = await endLiveSession(roomId, userId);
    
    // Notify all participants that the room has ended
    emitRoomEnded(roomId.toString());
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function join(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthedUser(req);
    const userId = getAuthedUserId(req);
    const roomId = parseObjectId(req.params.roomId || req.body?.roomId, "roomId");
    const displayName = req.body?.displayName || user.firstname || user.email || "Participant";
    const role = (req.body?.role || "attendee") as LiveParticipantRole;
    const result = await joinLiveRoom(roomId, userId, displayName, role);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function leave(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getAuthedUserId(req);
    const roomId = parseObjectId(req.params.roomId || req.body?.roomId, "roomId");
    const result = await leaveLiveRoom(roomId, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function message(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthedUser(req);
    const userId = getAuthedUserId(req);
    const roomId = parseObjectId(req.params.roomId || req.body?.roomId, "roomId");
    const displayName = req.body?.displayName || user.firstname || user.email || "Participant";
    const result = await sendLiveMessage(roomId, userId, displayName, req.body || {});
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function attendance(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthedUser(req);
    const userId = getAuthedUserId(req);
    const roomId = parseObjectId(req.params.roomId || req.body?.roomId, "roomId");
    const displayName = req.body?.displayName || user.firstname || user.email || "Participant";
    const result = await recordLiveAttendance(roomId, userId, displayName, req.body || {});
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function reaction(req: Request, res: Response, next: NextFunction) {
  try {
    const user = getAuthedUser(req);
    const userId = getAuthedUserId(req);
    const roomId = parseObjectId(req.params.roomId || req.body?.roomId, "roomId");
    const displayName = req.body?.displayName || user.firstname || user.email || "Participant";
    const result = await sendLiveReaction(roomId, userId, displayName, req.body || {});
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function messages(req: Request, res: Response, next: NextFunction) {
  try {
    const roomId = parseObjectId(req.params.roomId || req.body?.roomId, "roomId");
    const page = Number(req.body?.page || 1);
    const pageSize = Number(req.body?.pageSize || 20);
    const result = await searchRoomMessages(roomId, page, pageSize);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function participantCounts(req: Request, res: Response, next: NextFunction) {
  try {
    const roomId = parseObjectId(req.params.roomId, "roomId");
    const result = await getRoomParticipantCounts(roomId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function roomLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await searchLiveRoomLogs(req.body || {});
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function roomLogDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const roomId = parseObjectId(req.params.roomId, "roomId");
    const result = await getLiveRoomLogDetail(roomId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function detailBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = asParamValue(req.params.slug);
    if (!slug) {
      throw Object.assign(new Error("slug is required"), { statusCode: 400 });
    }
    
    // Try to get userId (optional - draft rooms only visible to host)
    let userId: ObjectId | undefined;
    try {
      userId = getAuthedUserId(req);
    } catch {
      // User not logged in - will only see non-draft rooms
    }
    
    const result = await getLiveRoomDetail({ slug }, userId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export {
  create,
  search,
  detail,
  goLive,
  endLive,
  join,
  leave,
  message,
  attendance,
  reaction,
  messages,
  participantCounts,
  roomLogs,
  roomLogDetail,
  detailBySlug,
};
