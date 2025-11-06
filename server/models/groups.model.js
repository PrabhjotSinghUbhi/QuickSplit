import { model, Schema } from "mongoose";
import crypto from "crypto";

// Member sub-schema for better organization
const memberSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        role: {
            type: String,
            enum: ["admin", "member"],
            default: "member"
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        balance: {
            type: Number,
            default: 0
        } // cached balance: positive = owed to them, negative = they owe
    },
    { _id: false }
);

const groupSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Group name is required"],
            trim: true,
            maxlength: [100, "Group name cannot exceed 100 characters"]
        },
        description: {
            type: String,
            default: "",
            maxlength: [500, "Description cannot exceed 500 characters"]
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        members: {
            type: [memberSchema],
            validate: {
                validator: function (members) {
                    return members.length > 0;
                },
                message: "Group must have at least one member"
            }
        },
        baseCurrency: {
            type: String,
            default: "INR",
            uppercase: true,
            enum: ["INR", "USD", "EUR", "GBP", "CAD", "AUD"] // Add more as needed
        },
        totalSpent: {
            type: Number,
            default: 0,
            min: 0
        },
        archived: {
            type: Boolean,
            default: false,
            index: true
        },
        settings: {
            allowCustomSplits: {
                type: Boolean,
                default: true
            },
            allowMultiCurrency: {
                type: Boolean,
                default: true
            },
            debtSimplification: {
                type: Boolean,
                default: true
            }
        },
        inviteCode: {
            type: String,
            unique: true,
            sparse: true, // allows null values while maintaining uniqueness
            index: true
        }
    },
    {
        timestamps: true // auto-manages createdAt and updatedAt
    }
);

// Index for faster queries
groupSchema.index({ "members.userId": 1 });
groupSchema.index({ createdBy: 1, archived: 1 });

// Pre-save hook to generate invite code if not provided
groupSchema.pre("save", function (next) {
    if (!this.inviteCode) {
        this.inviteCode = crypto.randomBytes(6).toString("hex").toUpperCase();
    }
    next();
});

// Method to add a member to the group
groupSchema.methods.addMember = function (userId, role = "member") {
    const existingMember = this.members.find(
        (m) => m.userId.toString() === userId.toString()
    );
    if (existingMember) {
        throw new Error("User is already a member of this group");
    }
    this.members.push({ userId, role });
    return this.save();
};

// Method to remove a member from the group
groupSchema.methods.removeMember = function (userId) {
    this.members = this.members.filter(
        (m) => m.userId.toString() !== userId.toString()
    );
    return this.save();
};

// Method to update member role
groupSchema.methods.updateMemberRole = function (userId, newRole) {
    const member = this.members.find((m) => {
        const memberId = m.userId._id ? m.userId._id.toString() : m.userId.toString();
        return memberId === userId.toString();
    });
    if (!member) {
        throw new Error("Member not found in this group");
    }
    member.role = newRole;
    return this.save();
};

// Method to check if user is admin
groupSchema.methods.isAdmin = function (userId) {
    const member = this.members.find((m) => {
        const memberId = m.userId._id ? m.userId._id.toString() : m.userId.toString();
        return memberId === userId.toString();
    });
    return member?.role === "admin";
};

// Method to check if user is a member
groupSchema.methods.isMember = function (userId) {
    if (!this.members || !Array.isArray(this.members)) {
        console.log('Warning: members array is not defined or not an array');
        return false;
    }
    
    return this.members.some((m) => {
        if (!m || !m.userId) {
            console.log('Warning: invalid member or missing userId:', m);
            return false;
        }
        // Handle both populated and unpopulated cases
        const memberId = (m.userId._id ? m.userId._id : m.userId).toString();
        const targetId = userId.toString();
        console.log('Comparing member:', memberId, 'with target:', targetId);
        return memberId === targetId;
    });
};

export const Group = model("Group", groupSchema);