import { Expense } from "../models/expense.model.js";
import { Group } from "../models/groups.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * Compute balances for all members based on expenses
 * @param {Array} expenses - All expenses in the group
 * @param {Array} members - Group members
 * @returns {Object} { balanceMap, totalSpent }
 */
const computeBalances = (expenses, members) => {
    const balanceMap = new Map();
    let totalSpent = 0;

    // Initialize balances for all members
    members.forEach((member) => {
        const userId = member.userId._id ? member.userId._id.toString() : member.userId.toString();
        balanceMap.set(userId, 0);
    });

    // Calculate balances from expenses
    expenses.forEach((expense) => {
        if (expense.isSettlement) {
            // Settlement expenses: payer paid receiver
            const payerId = expense.paidBy._id ? expense.paidBy._id.toString() : expense.paidBy.toString();
            const receiverId = expense.splitBetween[0]._id 
                ? expense.splitBetween[0]._id.toString() 
                : expense.splitBetween[0].toString();
            const amount = expense.amount;

            if (balanceMap.has(payerId)) {
                balanceMap.set(payerId, balanceMap.get(payerId) + amount);
            }
            if (balanceMap.has(receiverId)) {
                balanceMap.set(receiverId, balanceMap.get(receiverId) - amount);
            }
        } else {
            // Regular expenses
            totalSpent += expense.amount;
            const payerId = expense.paidBy._id ? expense.paidBy._id.toString() : expense.paidBy.toString();

            // Add to payer's balance (they paid)
            if (balanceMap.has(payerId)) {
                balanceMap.set(payerId, balanceMap.get(payerId) + expense.amount);
            }

            // Calculate splits and subtract from each person's balance (they owe)
            const splits = expense.calculateSplits();
            splits.forEach((split) => {
                const userId = split.userId._id ? split.userId._id.toString() : split.userId.toString();
                if (balanceMap.has(userId)) {
                    balanceMap.set(userId, balanceMap.get(userId) - split.amount);
                }
            });
        }
    });

    return { balanceMap, totalSpent };
};

// Get all expenses for a group
const getExpenses = asyncHandler(async (req, res) => {
    try {
        const groupId = req.params.groupId || req.groupId; // Try both sources
        const userId = req.user._id;

        if (!groupId || groupId === "undefined" || groupId === ":groupId") {
            throw new ApiError(400, "Invalid group ID provided");
        }

        const group = await Group.findById(groupId)
            .populate("members.userId")
            .populate("createdBy");

        if (!group) {
            throw new ApiError(404, "Group not found");
        }

        // Check if user is a member
        const isMember = group.isMember(userId);

        if (!isMember) {
            throw new ApiError(403, "You are not a member of this group");
        }

        const expenses = await Expense.getGroupExpenses(groupId);

        // Transform expenses to match client structure
        const transformedExpenses = expenses.map((expense) => ({
            _id: expense._id,
            groupId: expense.group,
            group: expense.group,
            description: expense.description,
            amount: expense.amount,
            currency: expense.currency,
            paidBy: {
                _id: expense.paidBy._id,
                name: expense.paidBy.fullName,
                email: expense.paidBy.email
            },
            splitBetween: expense.splitBetween.map((user) => user._id),
            splitType: expense.splitType,
            splitDetails: expense.splitDetails,
            category: expense.category,
            date: expense.date,
            createdAt: expense.createdAt,
            updatedAt: expense.updatedAt,
            notes: expense.notes,
            isSettlement: expense.isSettlement,
            settled: expense.settled
        }));

        return res
            .status(200)
            .json(
                new ApiResponse(
                    transformedExpenses,
                    200,
                    "Expenses fetched successfully"
                )
            );
    } catch (error) {
        console.error("Error in fetching expenses:", error.message);
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to fetch expenses"
                )
            );
    }
});

// Get a single expense by ID
const getExpenseById = asyncHandler(async (req, res) => {
    try {
        const { expenseId } = req.params;
        const userId = req.user._id;

        const expense = await Expense.findById(expenseId)
            .populate("paidBy", "fullName email username")
            .populate("splitBetween", "fullName email username")
            .populate("group", "name description");

        if (!expense) {
            throw new ApiError(404, "Expense not found");
        }

        // Check if user is part of this expense (either paid or split)
        const isInvolved =
            expense.paidBy._id.toString() === userId.toString() ||
            expense.splitBetween.some(
                (user) => user._id.toString() === userId.toString()
            );

        if (!isInvolved) {
            throw new ApiError(403, "You are not involved in this expense");
        }

        // Transform expense to match client structure
        const transformedExpense = {
            _id: expense._id,
            groupId: expense.group._id,
            group: expense.group._id,
            description: expense.description,
            amount: expense.amount,
            currency: expense.currency,
            paidBy: {
                _id: expense.paidBy._id,
                name: expense.paidBy.fullName,
                email: expense.paidBy.email
            },
            splitBetween: expense.splitBetween.map((user) => user._id),
            splitType: expense.splitType,
            splitDetails: expense.splitDetails,
            category: expense.category,
            date: expense.date,
            createdAt: expense.createdAt,
            updatedAt: expense.updatedAt,
            notes: expense.notes,
            isSettlement: expense.isSettlement,
            settled: expense.settled
        };

        return res
            .status(200)
            .json(
                new ApiResponse(
                    transformedExpense,
                    200,
                    "Expense fetched successfully"
                )
            );
    } catch (error) {
        console.error("Error in fetching expense:", error.message);
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to fetch expense"
                )
            );
    }
});

// Create a new expense
const createExpense = asyncHandler(async (req, res) => {
    try {
        const groupId = req.params.groupId || req.groupId;
        const {
            description,
            amount,
            currency,
            paidBy,
            splitBetween,
            splitType,
            splitDetails,
            category,
            date,
            notes,
            isSettlement
        } = req.body;
        const userId = req.user._id;

        console.log('\nExpense Controller - createExpense:');
        console.log('Full URL:', req.originalUrl);
        console.log('Method:', req.method);
        console.log('All Params:', JSON.stringify(req.params, null, 2));
        console.log('GroupId from params:', req.params.groupId);
        console.log('GroupId from req object:', req.groupId);
        console.log('Final groupId used:', groupId);
        console.log("Request Body:", req.body);

        if (!groupId || groupId === 'undefined' || groupId === ':groupId') {
            throw new ApiError(400, "Invalid group ID provided");
        }

        // Validate required fields
        if (!description || !amount) {
            throw new ApiError(400, "Description and amount are required");
        }

        const group = await Group.findById(groupId);

        if (!group) {
            throw new ApiError(404, "Group not found");
        }

        // Check if user is a member
        if (!group.isMember(userId)) {
            throw new ApiError(403, "You are not a member of this group");
        }

        // Determine paidBy - use provided or default to current user
        const payerId = paidBy?._id || paidBy || userId;

        // Verify payer is a member
        if (!group.isMember(payerId)) {
            throw new ApiError(400, "Payer must be a member of the group");
        }

        // Validate splitBetween
        let splitUserIds = splitBetween || [];

        // If splitBetween is not provided, split among all members
        if (!splitUserIds || splitUserIds.length === 0) {
            splitUserIds = group.members.map((m) => m.userId);
        }

        // Verify all users in splitBetween are group members
        for (const splitUserId of splitUserIds) {
            if (!group.isMember(splitUserId)) {
                throw new ApiError(
                    400,
                    "All users in split must be group members"
                );
            }
        }

        // Create the expense
        const newExpense = new Expense({
            group: groupId,
            description: description.trim(),
            amount: Number.parseFloat(amount),
            currency: currency || group.baseCurrency || "INR",
            paidBy: payerId,
            splitBetween: splitUserIds,
            splitType: splitType || "equal",
            splitDetails: splitDetails || [],
            category: category || "Other",
            date: date || new Date(),
            notes: notes || "",
            isSettlement: isSettlement || false,
            createdBy: userId
        });

        await newExpense.save();

        // Recompute balances from complete expense history
        // IMPORTANT: Never mutate historical records - always recompute
        const allExpenses = await Expense.find({ group: groupId })
            .populate('paidBy', 'fullName email')
            .populate('splitBetween', 'fullName email');
        const { balanceMap, totalSpent } = computeBalances(allExpenses, group.members);

        // Update group member balances
        group.members.forEach((member) => {
            const userId = member.userId._id.toString();
            const balance = balanceMap.get(userId);
            member.balance = balance !== undefined ? balance : 0;
        });
        group.totalSpent = totalSpent;
        
        await group.save();

        // Populate the expense
        await newExpense.populate("paidBy", "fullName email username");
        await newExpense.populate("splitBetween", "fullName email username");

        // Transform expense to match client structure
        const transformedExpense = {
            _id: newExpense._id,
            groupId: newExpense.group,
            group: newExpense.group,
            description: newExpense.description,
            amount: newExpense.amount,
            currency: newExpense.currency,
            paidBy: {
                _id: newExpense.paidBy._id,
                name: newExpense.paidBy.fullName,
                email: newExpense.paidBy.email
            },
            splitBetween: newExpense.splitBetween.map((user) => user._id),
            splitType: newExpense.splitType,
            splitDetails: newExpense.splitDetails,
            category: newExpense.category,
            date: newExpense.date,
            createdAt: newExpense.createdAt,
            notes: newExpense.notes,
            isSettlement: newExpense.isSettlement
        };

        return res
            .status(201)
            .json(
                new ApiResponse(
                    transformedExpense,
                    201,
                    "Expense created successfully"
                )
            );
    } catch (error) {
        console.error("Error in creating expense:", error.message);
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to create expense"
                )
            );
    }
});

// Update an expense
const updateExpense = asyncHandler(async (req, res) => {
    try {
        const { expenseId } = req.params;
        const {
            description,
            amount,
            currency,
            paidBy,
            splitBetween,
            splitType,
            splitDetails,
            category,
            date,
            notes
        } = req.body;
        const userId = req.user._id;

        const expense = await Expense.findById(expenseId).populate(
            "group",
            "members"
        );

        if (!expense) {
            throw new ApiError(404, "Expense not found");
        }

        // Check if user is the creator or payer
        if (
            expense.createdBy.toString() !== userId.toString() &&
            expense.paidBy.toString() !== userId.toString()
        ) {
            throw new ApiError(
                403,
                "Only the expense creator or payer can update it"
            );
        }

        // Store old amount for group total adjustment
        const oldAmount = expense.amount;

        // Update fields if provided
        if (description !== undefined) expense.description = description.trim();
        if (amount !== undefined) expense.amount = Number.parseFloat(amount);
        if (currency !== undefined) expense.currency = currency;
        if (paidBy !== undefined) expense.paidBy = paidBy;
        if (splitBetween !== undefined) expense.splitBetween = splitBetween;
        if (splitType !== undefined) expense.splitType = splitType;
        if (splitDetails !== undefined) expense.splitDetails = splitDetails;
        if (category !== undefined) expense.category = category;
        if (date !== undefined) expense.date = date;
        if (notes !== undefined) expense.notes = notes;

        await expense.save();

        // Update group's total spent if amount changed (but not for settlements)
        if (amount !== undefined && amount !== oldAmount && !expense.isSettlement) {
            const group = await Group.findById(expense.group._id);
            group.totalSpent = group.totalSpent - oldAmount + expense.amount;
            await group.save();
        }

        // Populate the expense
        await expense.populate("paidBy", "fullName email username");
        await expense.populate("splitBetween", "fullName email username");

        // Transform expense to match client structure
        const transformedExpense = {
            _id: expense._id,
            groupId: expense.group._id,
            group: expense.group._id,
            description: expense.description,
            amount: expense.amount,
            currency: expense.currency,
            paidBy: {
                _id: expense.paidBy._id,
                name: expense.paidBy.fullName,
                email: expense.paidBy.email
            },
            splitBetween: expense.splitBetween.map((user) => user._id),
            splitType: expense.splitType,
            splitDetails: expense.splitDetails,
            category: expense.category,
            date: expense.date,
            createdAt: expense.createdAt,
            updatedAt: expense.updatedAt,
            notes: expense.notes,
            isSettlement: expense.isSettlement
        };

        return res
            .status(200)
            .json(
                new ApiResponse(
                    transformedExpense,
                    200,
                    "Expense updated successfully"
                )
            );
    } catch (error) {
        console.error("Error in updating expense:", error.message);
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to update expense"
                )
            );
    }
});

// Delete an expense
const deleteExpense = asyncHandler(async (req, res) => {
    try {
        const { expenseId } = req.params;
        const userId = req.user._id;

        const expense = await Expense.findById(expenseId);

        if (!expense) {
            throw new ApiError(404, "Expense not found");
        }

        // Check if user is the creator or payer
        if (
            expense.createdBy.toString() !== userId.toString() &&
            expense.paidBy.toString() !== userId.toString()
        ) {
            throw new ApiError(
                403,
                "Only the expense creator or payer can delete it"
            );
        }

        // Update group's total spent (but not for settlements)
        if (!expense.isSettlement) {
            const group = await Group.findById(expense.group);
            if (group) {
                group.totalSpent = Math.max(0, group.totalSpent - expense.amount);
                await group.save();
            }
        }

        await Expense.findByIdAndDelete(expenseId);

        return res
            .status(200)
            .json(new ApiResponse(null, 200, "Expense deleted successfully"));
    } catch (error) {
        console.error("Error in deleting expense:", error.message);
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to delete expense"
                )
            );
    }
});

// Get available expense categories
const getCategories = asyncHandler(async (req, res) => {
    try {
        const categories = [
            { name: "Food", icon: "UtensilsCrossed" },
            { name: "Transportation", icon: "Car" },
            { name: "Entertainment", icon: "Film" },
            { name: "Shopping", icon: "ShoppingBag" },
            { name: "Housing", icon: "Home" },
            { name: "Utilities", icon: "Zap" },
            { name: "Healthcare", icon: "Heart" },
            { name: "Travel", icon: "Plane" },
            { name: "Education", icon: "GraduationCap" },
            { name: "Fitness", icon: "Dumbbell" },
            { name: "Settlement", icon: "ArrowRightLeft" },
            { name: "Other", icon: "MoreHorizontal" }
        ];

        return res
            .status(200)
            .json(
                new ApiResponse(
                    categories,
                    200,
                    "Categories fetched successfully"
                )
            );
    } catch (error) {
        console.error("Error in fetching categories:", error.message);
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to fetch categories"
                )
            );
    }
});

export {
    getExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense,
    getCategories
};
