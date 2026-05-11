import { Router } from "express";
import { ObjectId } from "mongodb";
import { getCollection } from "../../config/db";
import { authenticateToken } from "../auth/auth.middleware";
import { strictRateLimiter } from "../../middlewares/rateLimiter";
import {
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
} from "./live.controller";

const router = Router();

router.post("/rooms", authenticateToken, create);
router.post("/rooms/search", search);
router.post("/rooms/detail", detail);
router.get("/rooms/slug/:slug", detailBySlug);
router.post("/rooms/:roomId/go-live", authenticateToken, strictRateLimiter, goLive);
router.post("/rooms/:roomId/end-live", authenticateToken, endLive);
router.post("/rooms/:roomId/join", authenticateToken, strictRateLimiter, join);
router.post("/rooms/:roomId/leave", authenticateToken, leave);
router.post("/rooms/:roomId/messages", authenticateToken, strictRateLimiter, message);
router.post("/rooms/:roomId/messages/search", messages);
router.post("/rooms/:roomId/attendance", authenticateToken, attendance);
router.post("/rooms/:roomId/reactions", authenticateToken, strictRateLimiter, reaction);
router.get("/rooms/:roomId/participants/counts", participantCounts);
router.post("/logs", authenticateToken, roomLogs);
router.get("/logs/:roomId", authenticateToken, roomLogDetail);
router.get("/rooms/:roomId/status", (req, res, next) => {
  const roomId = req.params.roomId;
  const rooms = getCollection("liveRooms");
  rooms.findOne({ _id: new ObjectId(roomId) }).then(room => {
    if (!room) {
      return res.status(404).json({ status: "not_found" });
    }
    res.json({ status: room.status, roomId: room._id.toString() });
  }).catch(next);
});

export default router;
