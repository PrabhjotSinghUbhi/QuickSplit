import Router from "express";
import {
    getRoomMessages,
    sendMessage,
    markMessagesAsRead,
    getUnreadCount
} from "../controller/chat.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// All chat routes require authentication
router.use(verifyJWT);

// Get messages for a room
router.route("/:roomId").get(getRoomMessages);

// Send a message
router.route("/send").post(sendMessage);

// Mark messages as read
router.route("/:roomId/read").put(markMessagesAsRead);

// Get unread count
router.route("/:roomId/unread").get(getUnreadCount);

export default router;
