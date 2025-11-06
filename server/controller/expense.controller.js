import { Expense } from "../models/expense.model.js";
import { Group } from "../models/groups.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get all expenses for a group
const getExpenses = asyncHandler(async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(groupId);

        if (!group) {
            throw new ApiError(404, "Group not found");
        }

        // Check if user is a member
        if (!group.isMember(userId)) {
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
        const { groupId } = req.params;
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
            createdBy: userId
        });

        await newExpense.save();

        // Update group's total spent
        group.totalSpent += newExpense.amount;
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

        // Update group's total spent if amount changed
        if (amount !== undefined && amount !== oldAmount) {
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

        // Update group's total spent
        const group = await Group.findById(expense.group);
        if (group) {
            group.totalSpent = Math.max(0, group.totalSpent - expense.amount);
            await group.save();
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

// Settle an expense (create a settlement payment)
const settleExpense = asyncHandler(async (req, res) => {
    try {
        const { groupId } = req.params;
        const { from, to, amount, currency, description } = req.body;
        const userId = req.user._id;

        // Validate required fields
        if (!from || !to || !amount) {
            throw new ApiError(
                400,
                "From, to, and amount are required for settlement"
            );
        }

        const group = await Group.findById(groupId);

        if (!group) {
            throw new ApiError(404, "Group not found");
        }

        // Check if user is a member
        if (!group.isMember(userId)) {
            throw new ApiError(403, "You are not a member of this group");
        }

        // Verify both users are members
        if (!group.isMember(from) || !group.isMember(to)) {
            throw new ApiError(400, "Both users must be group members");
        }

        // Get user details for description
        const fromUser = await User.findById(from);
        const toUser = await User.findById(to);

        // Create settlement expense
        const settlement = new Expense({
            group: groupId,
            description:
                description ||
                `Settlement: ${fromUser.fullName} paid ${toUser.fullName}`,
            amount: Number.parseFloat(amount),
            currency: currency || group.baseCurrency || "INR",
            paidBy: from,
            splitBetween: [to],
            splitType: "settlement",
            category: "Settlement",
            date: new Date(),
            isSettlement: true,
            settled: true,
            createdBy: userId
        });

        await settlement.save();

        // Populate the settlement
        await settlement.populate("paidBy", "fullName email username");
        await settlement.populate("splitBetween", "fullName email username");

        // Transform settlement to match client structure
        const transformedSettlement = {
            _id: settlement._id,
            groupId: settlement.group,
            group: settlement.group,
            description: settlement.description,
            amount: settlement.amount,
            currency: settlement.currency,
            paidBy: {
                _id: settlement.paidBy._id,
                name: settlement.paidBy.fullName,
                email: settlement.paidBy.email
            },
            splitBetween: settlement.splitBetween.map((user) => user._id),
            splitType: settlement.splitType,
            category: settlement.category,
            date: settlement.date,
            createdAt: settlement.createdAt,
            isSettlement: settlement.isSettlement,
            settled: settlement.settled
        };

        return res
            .status(201)
            .json(
                new ApiResponse(
                    transformedSettlement,
                    201,
                    "Settlement recorded successfully"
                )
            );
    } catch (error) {
        console.error("Error in settling expense:", error.message);
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Failed to settle expense"
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
    settleExpense
};
