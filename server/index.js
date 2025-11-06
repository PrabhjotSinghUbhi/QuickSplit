import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { Message } from "./models/message.model.js";
import { Group } from "./models/groups.model.js";
import jwt from "jsonwebtoken";
import { User } from "./models/user.model.js";

dotenv.config();

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN === '*' 
            ? '*' 
            : (process.env.CORS_ORIGIN || "http://localhost:5173").split(',').map(o => o.trim()),
        credentials: true,
        methods: ["GET", "POST"]
    }
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");
        
        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded._id).select("-password -refreshToken");

        if (!user) {
            return next(new Error("Authentication error: User not found"));
        }

        socket.userId = user._id;
        socket.user = user;
        next();
    } catch (error) {
        next(new Error("Authentication error: Invalid token"));
    }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.fullName} (${socket.userId})`);

    // Join a group room
    socket.on("join_room", async (roomId) => {
        try {
            // Verify user is a member of the group
            const group = await Group.findById(roomId);
            
            if (!group || !group.isMember(socket.userId)) {
                socket.emit("error", { message: "Not authorized to join this room" });
                return;
            }

            socket.join(roomId);
            console.log(`User ${socket.user.fullName} joined room: ${roomId}`);

            // Notify others in the room
            socket.to(roomId).emit("user_joined", {
                userId: socket.userId,
                userName: socket.user.fullName,
                timestamp: new Date()
            });

            // Send confirmation to the user
            socket.emit("room_joined", { roomId });
        } catch (error) {
            socket.emit("error", { message: "Failed to join room" });
        }
    });

    // Leave a group room
    socket.on("leave_room", (roomId) => {
        socket.leave(roomId);
        console.log(`User ${socket.user.fullName} left room: ${roomId}`);

        // Notify others in the room
        socket.to(roomId).emit("user_left", {
            userId: socket.userId,
            userName: socket.user.fullName,
            timestamp: new Date()
        });
    });

    // Send message
    socket.on("send_message", async (data) => {
        try {
            const { roomId, message } = data;

            if (!roomId || !message) {
                socket.emit("error", { message: "Room ID and message are required" });
                return;
            }

            // Verify user is a member of the group
            const group = await Group.findById(roomId);
            
            if (!group || !group.isMember(socket.userId)) {
                socket.emit("error", { message: "Not authorized to send messages to this room" });
                return;
            }

            // Save message to database
            const newMessage = new Message({
                roomId,
                senderId: socket.userId,
                message: message.trim(),
                messageType: data.messageType || "text"
            });

            await newMessage.save();
            await newMessage.populate("senderId", "fullName email username");

            // Transform message for client
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

            // Broadcast to all users in the room (including sender)
            io.to(roomId).emit("receive_message", transformedMessage);

            console.log(`Message sent in room ${roomId} by ${socket.user.fullName}`);
        } catch (error) {
            socket.emit("error", { message: "Failed to send message" });
        }
    });

    // Typing indicator
    socket.on("typing", (data) => {
        const { roomId, isTyping } = data;
        socket.to(roomId).emit("user_typing", {
            userId: socket.userId,
            userName: socket.user.fullName,
            isTyping
        });
    });

    // Mark messages as read
    socket.on("mark_as_read", async (data) => {
        try {
            const { roomId } = data;
            await Message.markAsRead(roomId, socket.userId);
            
            // Notify others that messages were read
            socket.to(roomId).emit("messages_read", {
                userId: socket.userId,
                roomId,
                timestamp: new Date()
            });
        } catch (error) {
            socket.emit("error", { message: "Failed to mark messages as read" });
        }
    });

    // Disconnect
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.user.fullName} (${socket.userId})`);
    });
});

// Start server
connectDB()
    .then(() => {
        const PORT = process.env.PORT || 8000;

        httpServer.listen(PORT, () => {
            console.log("Server running on PORT : ", PORT);
            console.log("Socket.IO server initialized");
        });

        httpServer.on("error", (err) => {
            console.log("Server Error: ", err);
            process.exit();
        });
    })
    .catch((err) => {
        console.error("ERROR :: MongoDB :: Connection Failed !!!", err);
        process.exit(1);
    });

export { io };
