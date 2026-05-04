import { Router } from "express";
import { authenticateToken } from "../auth/auth.middleware";
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
} from "./live.controller";

const router = Router();

router.post("/rooms", authenticateToken, create);
router.post("/rooms/search", search);
router.post("/rooms/detail", detail);
router.post("/rooms/:roomId/go-live", authenticateToken, goLive);
router.post("/rooms/:roomId/end-live", authenticateToken, endLive);
router.post("/rooms/:roomId/join", authenticateToken, join);
router.post("/rooms/:roomId/leave", authenticateToken, leave);
router.post("/rooms/:roomId/messages", authenticateToken, message);
router.post("/rooms/:roomId/messages/search", messages);
router.post("/rooms/:roomId/attendance", authenticateToken, attendance);
router.post("/rooms/:roomId/reactions", authenticateToken, reaction);

export default router;
