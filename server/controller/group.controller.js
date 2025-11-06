import { Group } from "../models/groups.model.js";
import { User } from "../models/user.model.js";
import { Expense } from "../models/expense.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get all groups for the authenticated user
const getGroups = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        const groups = await Group.find({
            "members.userId": userId,
            archived: false
        })
            .populate("createdBy", "fullName email username")
            .populate("members.userId", "fullName email username")
            .sort({ updatedAt: -1 });

        // Get expense counts for each group
        const groupIds = groups.map(g => g._id);
        const expenseCounts = await Expense.aggregate([
            { $match: { group: { $in: groupIds } } },
            { $group: { _id: "$group", count: { $sum: 1 } } }
        ]);
        
        const expenseCountMap = {};
        expenseCounts.forEach(ec => {
            expenseCountMap[ec._id.toString()] = ec.count;
        });

        // Transform groups to match client structure
        const transformedGroups = groups.map((group) => ({
            _id: group._id,
            name: group.name,
            description: group.description,
            members: group.members.map((m) => ({
                _id: m.userId._id,
                name: m.userId.fullName,
                email: m.userId.email,
                role: m.role,
                balance: m.balance
            })),
            createdBy: group.createdBy._id,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
            baseCurrency: group.baseCurrency,
            totalSpent: group.totalSpent,
            expenseCount: expenseCountMap[group._id.toString()] || 0,
            balances: group.members.map((m) => ({
                user: m.userId._id,
                amount: m.balance
            }))
        }));

        return res
            .status(200)
            .json(
                new ApiResponse(
                    transformedGroups,
                    200,
                    "Groups fetched successfully"
                )
            );
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to fetch groups"
                )
            );
    }
});

// Get a single group by ID
const getGroupById = asyncHandler(async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(groupId)
            .populate("createdBy", "fullName email username")
            .populate("members.userId", "fullName email username");

        if (!group) {
            throw new ApiError(404, "Group not found");
        }

        // Check if user is a member of the group
        if (!group.isMember(userId)) {
            throw new ApiError(403, "You are not a member of this group");
        }

        // Transform group to match client structure
        const transformedGroup = {
            _id: group._id,
            name: group.name,
            description: group.description,
            members: group.members.map((m) => ({
                _id: m.userId._id,
                name: m.userId.fullName,
                email: m.userId.email,
                role: m.role,
                balance: m.balance
            })),
            createdBy: group.createdBy._id,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
            baseCurrency: group.baseCurrency,
            totalSpent: group.totalSpent,
            balances: group.members.map((m) => ({
                user: m.userId._id,
                amount: m.balance
            })),
            inviteCode: group.inviteCode
        };

        return res
            .status(200)
            .json(
                new ApiResponse(
                    transformedGroup,
                    200,
                    "Group fetched successfully"
                )
            );
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to fetch group"
                )
            );
    }
});

// Create a new group
const createGroup = asyncHandler(async (req, res) => {
    try {
        const { name, description, members, baseCurrency } = req.body;
        const userId = req.user._id;

        if (!name || !name.trim()) {
            throw new ApiError(400, "Group name is required");
        }

        // Initialize members array with creator as admin
        const groupMembers = [
            {
                userId: userId,
                role: "admin",
                balance: 0
            }
        ];

        // Add additional members if provided
        if (members && Array.isArray(members)) {
            for (const member of members) {
                // member can be email or userId
                let user;
                if (member.email) {
                    user = await User.findOne({
                        email: member.email.toLowerCase()
                    });
                } else if (member.userId || member._id) {
                    user = await User.findById(member.userId || member._id);
                }

                if (user && user._id.toString() !== userId.toString()) {
                    groupMembers.push({
                        userId: user._id,
                        role: "member",
                        balance: 0
                    });
                }
            }
        }

        const newGroup = new Group({
            name: name.trim(),
            description: description || "",
            createdBy: userId,
            members: groupMembers,
            baseCurrency: baseCurrency || "INR"
        });

        await newGroup.save();

        // Populate the group before sending response
        await newGroup.populate("createdBy", "fullName email username");
        await newGroup.populate("members.userId", "fullName email username");

        // Transform group to match client structure
        const transformedGroup = {
            _id: newGroup._id,
            name: newGroup.name,
            description: newGroup.description,
            members: newGroup.members.map((m) => ({
                _id: m.userId._id,
                name: m.userId.fullName,
                email: m.userId.email,
                role: m.role,
                balance: m.balance
            })),
            createdBy: newGroup.createdBy._id,
            createdAt: newGroup.createdAt,
            baseCurrency: newGroup.baseCurrency,
            totalSpent: newGroup.totalSpent,
            balances: newGroup.members.map((m) => ({
                user: m.userId._id,
                amount: m.balance
            })),
            inviteCode: newGroup.inviteCode
        };

        return res
            .status(201)
            .json(
                new ApiResponse(
                    transformedGroup,
                    201,
                    "Group created successfully"
                )
            );
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to create group"
                )
            );
    }
});

// Update a group
const updateGroup = asyncHandler(async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description, baseCurrency } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(groupId);

        if (!group) {
            throw new ApiError(404, "Group not found");
        }

        // Check if user is admin of the group
        if (!group.isAdmin(userId)) {
            throw new ApiError(403, "Only group admins can update the group");
        }

        // Update fields if provided
        if (name !== undefined) group.name = name.trim();
        if (description !== undefined) group.description = description;
        if (baseCurrency !== undefined) group.baseCurrency = baseCurrency;

        await group.save();

        await group.populate("createdBy", "fullName email username");
        await group.populate("members.userId", "fullName email username");

        // Transform group to match client structure
        const transformedGroup = {
            _id: group._id,
            name: group.name,
            description: group.description,
            members: group.members.map((m) => ({
                _id: m.userId._id,
                name: m.userId.fullName,
                email: m.userId.email,
                role: m.role,
                balance: m.balance
            })),
            createdBy: group.createdBy._id,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
            baseCurrency: group.baseCurrency,
            totalSpent: group.totalSpent,
            balances: group.members.map((m) => ({
                user: m.userId._id,
                amount: m.balance
            }))
        };

        return res
            .status(200)
            .json(
                new ApiResponse(
                    transformedGroup,
                    200,
                    "Group updated successfully"
                )
            );
    } catch (error) {
        console.error("Error in updating group:", error.message);
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to update group"
                )
            );
    }
});

// Delete a group
const deleteGroup = asyncHandler(async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(groupId);

        if (!group) {
            throw new ApiError(404, "Group not found");
        }

        // Check if user is the creator or admin
        if (
            group.createdBy.toString() !== userId.toString() &&
            !group.isAdmin(userId)
        ) {
            throw new ApiError(
                403,
                "Only the group creator or admin can delete the group"
            );
        }

        // Delete all expenses associated with this group
        await Expense.deleteMany({ group: groupId });

        // Delete the group
        await Group.findByIdAndDelete(groupId);

        return res
            .status(200)
            .json(new ApiResponse(null, 200, "Group deleted successfully"));
    } catch (error) {
        console.error("Error in deleting group:", error.message);
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to delete group"
                )
            );
    }
});

// Add a member to the group
const addMember = asyncHandler(async (req, res) => {
    try {
        const groupId = req.params.groupId || req.groupId;
        const { email, userId: newUserId } = req.body;
        const userId = req.user._id;

        if (!groupId || groupId === 'undefined') {
            throw new ApiError(400, "Invalid group ID provided");
        }

        const group = await Group.findById(groupId)
            .populate('members.userId')
            .populate('createdBy');

        if (!group) {
            throw new ApiError(404, "Group not found");
        }

        // Check if user is a member of the group
        if (!group.isMember(userId)) {
            throw new ApiError(403, "Only group members can add new members");
        }

        // Find the user to add
        let userToAdd;
        if (email) {
            userToAdd = await User.findOne({ email: email.toLowerCase() });
        } else if (newUserId) {
            userToAdd = await User.findById(newUserId);
        }

        if (!userToAdd) {
            throw new ApiError(404, "User not registered");
        }

        // Check if user is already a member
        if (group.isMember(userToAdd._id)) {
            throw new ApiError(400, "User is already a member of this group");
        }

        // Add the member
        group.members.push({
            userId: userToAdd._id,
            role: "member",
            balance: 0
        });

        await group.save();
        await group.populate("members.userId", "fullName email username");
        await group.populate("createdBy", "fullName email username");

        // Transform group to match client structure
        const transformedGroup = {
            _id: group._id,
            name: group.name,
            description: group.description,
            members: group.members.map((m) => ({
                _id: m.userId._id,
                name: m.userId.fullName,
                email: m.userId.email,
                role: m.role,
                balance: m.balance
            })),
            createdBy: group.createdBy._id,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
            balances: group.members.map((m) => ({
                user: m.userId._id,
                amount: m.balance
            }))
        };

        return res
            .status(200)
            .json(
                new ApiResponse(
                    transformedGroup,
                    200,
                    "Member added successfully"
                )
            );
    } catch (error) {
        console.error("Error in adding member:", error.message);
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to add member"
                )
            );
    }
});

// Remove a member from the group
const removeMember = asyncHandler(async (req, res) => {
    try {
        const groupId = req.params.groupId || req.groupId;
        const { memberId } = req.params;
        const userId = req.user._id;

        if (!groupId || groupId === 'undefined') {
            throw new ApiError(400, "Invalid group ID provided");
        }

        const group = await Group.findById(groupId)
            .populate('members.userId')
            .populate('createdBy');

        if (!group) {
            throw new ApiError(404, "Group not found");
        }

        // Check if user is admin or the member being removed
        if (
            !group.isAdmin(userId) &&
            userId.toString() !== memberId.toString()
        ) {
            throw new ApiError(
                403,
                "Only admins can remove members, or members can remove themselves"
            );
        }

        // Don't allow removing the last admin
        const memberToRemove = group.members.find(
            (m) => m.userId.toString() === memberId.toString()
        );

        if (memberToRemove && memberToRemove.role === "admin") {
            const adminCount = group.members.filter(
                (m) => m.role === "admin"
            ).length;
            if (adminCount <= 1) {
                throw new ApiError(
                    400,
                    "Cannot remove the last admin. Please assign another admin first."
                );
            }
        }

        // Remove the member
        group.members = group.members.filter(
            (m) => m.userId.toString() !== memberId.toString()
        );

        await group.save();
        await group.populate("members.userId", "fullName email username");
        await group.populate("createdBy", "fullName email username");

        // Transform group to match client structure
        const transformedGroup = {
            _id: group._id,
            name: group.name,
            description: group.description,
            members: group.members.map((m) => ({
                _id: m.userId._id,
                name: m.userId.fullName,
                email: m.userId.email,
                role: m.role,
                balance: m.balance
            })),
            createdBy: group.createdBy._id,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
            balances: group.members.map((m) => ({
                user: m.userId._id,
                amount: m.balance
            }))
        };

        return res
            .status(200)
            .json(
                new ApiResponse(
                    transformedGroup,
                    200,
                    "Member removed successfully"
                )
            );
    } catch (error) {
        console.error("Error in removing member:", error.message);
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to remove member"
                )
            );
    }
});

// Get balances for a group
const getBalances = asyncHandler(async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(groupId).populate(
            "members.userId",
            "fullName email username"
        );

        if (!group) {
            throw new ApiError(404, "Group not found");
        }

        // Check if user is a member
        if (!group.isMember(userId)) {
            throw new ApiError(403, "You are not a member of this group");
        }

        // Calculate balances from expenses
        const expenses = await Expense.find({ group: groupId });

        // Reset balances
        const balanceMap = new Map();
        group.members.forEach((member) => {
            balanceMap.set(member.userId._id.toString(), 0);
        });

        // Calculate balances based on expenses
        expenses.forEach((expense) => {
            if (expense.isSettlement) {
                // For settlements, adjust balances accordingly
                const payerId = expense.paidBy.toString();
                const receiverId = expense.splitBetween[0]?.toString();

                if (payerId && receiverId) {
                    balanceMap.set(
                        payerId,
                        (balanceMap.get(payerId) || 0) - expense.amount
                    );
                    balanceMap.set(
                        receiverId,
                        (balanceMap.get(receiverId) || 0) + expense.amount
                    );
                }
            } else {
                // Regular expense
                const splits = expense.calculateSplits();
                const payerId = expense.paidBy.toString();

                // Payer gets credited for the full amount
                balanceMap.set(
                    payerId,
                    (balanceMap.get(payerId) || 0) + expense.amount
                );

                // Each participant gets debited their share
                splits.forEach((split) => {
                    const userId = split.userId.toString();
                    balanceMap.set(
                        userId,
                        (balanceMap.get(userId) || 0) - split.amount
                    );
                });
            }
        });

        // Update group member balances
        group.members.forEach((member) => {
            member.balance = balanceMap.get(member.userId._id.toString()) || 0;
        });

        await group.save();

        // Format balances for response
        const balances = group.members.map((m) => ({
            user: m.userId._id,
            name: m.userId.fullName,
            email: m.userId.email,
            amount: m.balance
        }));

        return res
            .status(200)
            .json(
                new ApiResponse(balances, 200, "Balances fetched successfully")
            );
    } catch (error) {
        console.error("Error in fetching balances:", error.message);
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to fetch balances"
                )
            );
    }
});

export {
    getGroups,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
    addMember,
    removeMember,
    getBalances
};
