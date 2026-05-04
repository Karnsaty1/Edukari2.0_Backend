import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import {
  joinLiveRoom,
  leaveLiveRoom,
  sendLiveMessage,
  recordLiveAttendance,
  sendLiveReaction,
} from "./live.service";

interface SocketUser {
  sub: string;
  email?: string;
  firstname?: string;
  role?: string;
}

let io: Server | null = null;

function verifySocketToken(token?: string): SocketUser | null {
  if (!token) {
    return null;
  }

  const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }

  try {
    const payload = jwt.verify(token, secret) as SocketUser & { tokenType?: string };
    if (payload.tokenType !== "access" || !payload.sub) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function getUserFromSocket(socket: Socket): SocketUser {
  const user = socket.data.user as SocketUser | undefined;

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
      });
    });

    socket.on("room:leave", ({ roomId }) => {
      runSocketTask(socket, async () => {
        const user = getUserFromSocket(socket);
        const roomKey = `live:${roomId}`;
        const result = await leaveLiveRoom(new ObjectId(roomId), new ObjectId(user.sub));
        socket.leave(roomKey);
        io?.to(roomKey).emit("participant:left", result);
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

export { initLiveSockets };
