import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        roomId: {
            type: String,
            required: true,
            index: true
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000
        },
        messageType: {
            type: String,
            enum: ["text", "system"],
            default: "text"
        },
        readBy: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                },
                readAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

// Index for efficient queries
messageSchema.index({ roomId: 1, createdAt: -1 });

// Static method to get messages for a room
messageSchema.statics.getRoomMessages = async function (roomId, limit = 50, skip = 0) {
    return this.find({ roomId })
        .populate("senderId", "fullName email username")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
};

// Static method to mark messages as read
messageSchema.statics.markAsRead = async function (roomId, userId) {
    return this.updateMany(
        {
            roomId,
            senderId: { $ne: userId },
            "readBy.userId": { $ne: userId }
        },
        {
            $push: {
                readBy: {
                    userId,
                    readAt: new Date()
                }
            }
        }
    );
};

export const Message = mongoose.model("Message", messageSchema);
