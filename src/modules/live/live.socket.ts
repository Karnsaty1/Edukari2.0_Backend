import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import type { JwtUser } from "../auth/auth.utils";
import {
  joinLiveRoom,
  leaveLiveRoom,
  sendLiveMessage,
  recordLiveAttendance,
  sendLiveReaction,
  getRoomParticipantCounts,
} from "./live.service";

let io: Server | null = null;

function getIO(): Server | null {
  return io;
}

export function emitRoomEnded(roomId: string) {
  if (!io) return;
  const roomKey = `live:${roomId}`;
  io.to(roomKey).emit("room:ended", { roomId, message: "The live session has ended" });
  io.to(roomKey).emit("participant:counts", { total: 0, active: 0, left: 0 });
}

function verifySocketToken(token?: string): JwtUser | null {
  if (!token) {
    return null;
  }

  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }

  try {
    const payload = jwt.verify(token, secret) as JwtUser;
    if (payload.tokenType !== "access" || !payload.sub) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function getUserFromSocket(socket: Socket): JwtUser {
  const user = socket.data.user as JwtUser | undefined;

  if (!user?.sub) {
    throw new Error("Unauthorized socket");
  }

  return user;
}

function runSocketTask(socket: Socket, task: () => Promise<void>) {
  void task().catch((error) => {
    const message =
      error instanceof Error ? error.message : "Live socket operation failed";
    socket.emit("error", { message });
  });
}

function initLiveSockets(server: HttpServer): Server {
  if (io) {
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || true,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token =
      (socket.handshake.auth && String(socket.handshake.auth.token || "")) ||
      String(socket.handshake.headers.authorization || "").replace(/^Bearer\s+/i, "");
    const user = verifySocketToken(token);

    if (!user) {
      return next(new Error("Unauthorized"));
    }

    socket.data.user = user;
    next();
  });

  io.on("connection", (socket) => {
    socket.on("room:join", ({ roomId, role, displayName }) => {
      runSocketTask(socket, async () => {
        const user = getUserFromSocket(socket);
        const roomKey = `live:${roomId}`;
        const result = await joinLiveRoom(
          new ObjectId(roomId),
          new ObjectId(user.sub),
          displayName || user.firstname || user.email || "Participant",
          role || "attendee"
        );

        socket.join(roomKey);
        io?.to(roomKey).emit("participant:joined", result);
        const counts = await getRoomParticipantCounts(new ObjectId(roomId));
        io?.to(roomKey).emit("participant:counts", counts);
      });
    });

    socket.on("room:leave", ({ roomId }) => {
      runSocketTask(socket, async () => {
        const user = getUserFromSocket(socket);
        const roomKey = `live:${roomId}`;
        const result = await leaveLiveRoom(new ObjectId(roomId), new ObjectId(user.sub));
        socket.leave(roomKey);
        io?.to(roomKey).emit("participant:left", result);
        const counts = await getRoomParticipantCounts(new ObjectId(roomId));
        io?.to(roomKey).emit("participant:counts", counts);
      });
    });

    socket.on("chat:send", ({ roomId, text, kind, displayName }) => {
      runSocketTask(socket, async () => {
        const user = getUserFromSocket(socket);
        const roomKey = `live:${roomId}`;
        const message = await sendLiveMessage(
          new ObjectId(roomId),
          new ObjectId(user.sub),
          displayName || user.firstname || user.email || "Participant",
          { text, kind }
        );
        io?.to(roomKey).emit("chat:new", message);
      });
    });

    socket.on("attendance:heartbeat", ({ roomId, watchSeconds, isPresent, displayName }) => {
      runSocketTask(socket, async () => {
        const user = getUserFromSocket(socket);
        const roomKey = `live:${roomId}`;
        const record = await recordLiveAttendance(
          new ObjectId(roomId),
          new ObjectId(user.sub),
          displayName || user.firstname || user.email || "Participant",
          { watchSeconds, isPresent }
        );
        io?.to(roomKey).emit("attendance:update", record);
      });
    });

    socket.on("reaction:send", ({ roomId, type, displayName }) => {
      runSocketTask(socket, async () => {
        const user = getUserFromSocket(socket);
        const roomKey = `live:${roomId}`;
        const reaction = await sendLiveReaction(
          new ObjectId(roomId),
          new ObjectId(user.sub),
          displayName || user.firstname || user.email || "Participant",
          { type }
        );
        io?.to(roomKey).emit("reaction:new", reaction);
      });
    });
  });

  return io;
}

export { initLiveSockets, getIO, emitRoomEnded };
