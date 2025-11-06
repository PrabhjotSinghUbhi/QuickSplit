import { Message } from "../models/message.model.js";
import { Group } from "../models/groups.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get all messages for a room/group
const getRoomMessages = asyncHandler(async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;
        const limit = parseInt(req.query.limit) || 50;
        const skip = parseInt(req.query.skip) || 0;

        // Verify user is a member of the group
        const group = await Group.findById(roomId);
        
        if (!group) {
            throw new ApiError(404, "Group not found");
        }

        if (!group.isMember(userId)) {
            throw new ApiError(403, "You are not a member of this group");
        }

        // Fetch messages
        const messages = await Message.getRoomMessages(roomId, limit, skip);

        // Mark messages as read
        await Message.markAsRead(roomId, userId);

        // Transform messages
        const transformedMessages = messages.reverse().map((msg) => ({
            _id: msg._id,
            roomId: msg.roomId,
            sender: {
                _id: msg.senderId._id,
                name: msg.senderId.fullName,
                email: msg.senderId.email,
                username: msg.senderId.username
            },
            message: msg.message,
            messageType: msg.messageType,
            readBy: msg.readBy,
            createdAt: msg.createdAt,
            updatedAt: msg.updatedAt
        }));

        return res
            .status(200)
            .json(
                new ApiResponse(
                    transformedMessages,
                    200,
                    "Messages fetched successfully"
                )
            );
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to fetch messages"
                )
            );
    }
});

// Send a message (for persistence)
const sendMessage = asyncHandler(async (req, res) => {
    try {
        const { roomId, message, messageType = "text" } = req.body;
        const userId = req.user._id;

        if (!roomId || !message) {
            throw new ApiError(400, "Room ID and message are required");
        }

        // Verify user is a member of the group
        const group = await Group.findById(roomId);
        
        if (!group) {
            throw new ApiError(404, "Group not found");
        }

        if (!group.isMember(userId)) {
            throw new ApiError(403, "You are not a member of this group");
        }

        // Create and save message
        const newMessage = new Message({
            roomId,
            senderId: userId,
            message: message.trim(),
            messageType
        });

        await newMessage.save();

        // Populate sender info
        await newMessage.populate("senderId", "fullName email username");

        // Transform message
        const transformedMessage = {
            _id: newMessage._id,
            roomId: newMessage.roomId,
            sender: {
                _id: newMessage.senderId._id,
                name: newMessage.senderId.fullName,
                email: newMessage.senderId.email,
                username: newMessage.senderId.username
            },
            message: newMessage.message,
            messageType: newMessage.messageType,
            readBy: newMessage.readBy,
            createdAt: newMessage.createdAt,
            updatedAt: newMessage.updatedAt
        };

        return res
            .status(201)
            .json(
                new ApiResponse(
                    transformedMessage,
                    201,
                    "Message sent successfully"
                )
            );
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to send message"
                )
            );
    }
});

// Mark messages as read
const markMessagesAsRead = asyncHandler(async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        // Verify user is a member of the group
        const group = await Group.findById(roomId);
        
        if (!group) {
            throw new ApiError(404, "Group not found");
        }

        if (!group.isMember(userId)) {
            throw new ApiError(403, "You are not a member of this group");
        }

        await Message.markAsRead(roomId, userId);

        return res
            .status(200)
            .json(new ApiResponse(null, 200, "Messages marked as read"));
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to mark messages as read"
                )
            );
    }
});

// Get unread message count for a room
const getUnreadCount = asyncHandler(async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        // Verify user is a member of the group
        const group = await Group.findById(roomId);
        
        if (!group) {
            throw new ApiError(404, "Group not found");
        }

        if (!group.isMember(userId)) {
            throw new ApiError(403, "You are not a member of this group");
        }

        const unreadCount = await Message.countDocuments({
            roomId,
            senderId: { $ne: userId },
            "readBy.userId": { $ne: userId }
        });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    { unreadCount },
                    200,
                    "Unread count fetched successfully"
                )
            );
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to fetch unread count"
                )
            );
    }
});

export { getRoomMessages, sendMessage, markMessagesAsRead, getUnreadCount };
