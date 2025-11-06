/**
 * Settlement Utility - Single source of truth for debt calculation and simplification
 * This module handles all balance calculations and debt optimization
 */

/**
 * Calculate net balances for all group members based on expenses
 * @param {Array} expenses - All expenses in the group
 * @param {Array} members - All group members
 * @returns {Object} { balanceMap: Map<userId, balance>, totalSpent: number }
 */
const calculateBalances = (expenses, members) => {
    const balanceMap = new Map();
    
    // Initialize all members with zero balance
    members.forEach((member) => {
        const userId = member.userId?._id?.toString() || member.userId?.toString() || member._id?.toString();
        balanceMap.set(userId, 0);
    });

    let totalSpent = 0;

    expenses.forEach((expense) => {
        const payerId = expense.paidBy?._id?.toString() || expense.paidBy?.toString();
        
        if (expense.isSettlement) {
            // Settlement: payer's balance increases (paid off debt), receiver's balance decreases (received payment)
            const receiverId = expense.splitBetween[0]?._id?.toString() || expense.splitBetween[0]?.toString();
            
            if (payerId && receiverId) {
                balanceMap.set(payerId, (balanceMap.get(payerId) || 0) + expense.amount);
                balanceMap.set(receiverId, (balanceMap.get(receiverId) || 0) - expense.amount);
            }
        } else {
            // Regular expense: add to totalSpent
            totalSpent += expense.amount;
            
            // Payer gets credited for full amount
            balanceMap.set(payerId, (balanceMap.get(payerId) || 0) + expense.amount);
            
            // Calculate and debit each participant's share
            const splits = expense.calculateSplits();
            splits.forEach((split) => {
                const userId = split.userId?._id?.toString() || split.userId?.toString();
                balanceMap.set(userId, (balanceMap.get(userId) || 0) - split.amount);
            });
        }
    });

    return { balanceMap, totalSpent };
};

/**
 * Simplify debts to minimize number of transactions
 * Uses greedy algorithm to match largest creditor with largest debtor
 * @param {Map} balanceMap - Map of userId to balance
 * @param {Array} members - Group members with user details
 * @returns {Array} Simplified transactions [{ from, to, amount }]
 */
const simplifyDebts = (balanceMap, members) => {
    // Create creditors (positive balance) and debtors (negative balance) arrays
    const creditors = [];
    const debtors = [];
    
    // Build user lookup map
    const userMap = new Map();
    members.forEach((member) => {
        const userId = member.userId?._id?.toString() || member.userId?.toString() || member._id?.toString();
        const userData = member.userId || member;
        userMap.set(userId, {
            _id: userId,
            name: userData.fullName || userData.name,
            email: userData.email
        });
    });

    balanceMap.forEach((balance, userId) => {
        if (balance > 0.01) {
            creditors.push({ userId, amount: balance, user: userMap.get(userId) });
        } else if (balance < -0.01) {
            debtors.push({ userId, amount: Math.abs(balance), user: userMap.get(userId) });
        }
    });

    // Sort for consistent results
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const transactions = [];
    let i = 0;
    let j = 0;

    while (i < creditors.length && j < debtors.length) {
        const creditor = creditors[i];
        const debtor = debtors[j];
        
        const settleAmount = Math.min(creditor.amount, debtor.amount);
        
        if (settleAmount > 0.01) {
            transactions.push({
                from: debtor.user,
                to: creditor.user,
                amount: Math.round(settleAmount * 100) / 100 // Round to 2 decimals
            });
        }

        creditor.amount -= settleAmount;
        debtor.amount -= settleAmount;

        if (creditor.amount < 0.01) i++;
        if (debtor.amount < 0.01) j++;
    }

    return transactions;
};

/**
 * Validate settlement transaction
 * @param {String} fromUserId - User paying
 * @param {String} toUserId - User receiving
 * @param {Number} amount - Settlement amount
 * @param {Map} balanceMap - Current balance map
 * @returns {Object} { valid: boolean, error: string }
 */
const validateSettlement = (fromUserId, toUserId, amount, balanceMap) => {
    // Check if users are different
    if (fromUserId === toUserId) {
        return { valid: false, error: "Cannot settle with yourself" };
    }

    // Check if amount is positive
    if (amount <= 0) {
        return { valid: false, error: "Settlement amount must be greater than 0" };
    }

    // Check if payer actually owes money (negative balance)
    const fromBalance = balanceMap.get(fromUserId) || 0;
    if (fromBalance >= 0) {
        return { valid: false, error: "Payer has no debt to settle" };
    }

    // Check if receiver is owed money (positive balance)
    const toBalance = balanceMap.get(toUserId) || 0;
    if (toBalance <= 0) {
        return { valid: false, error: "Receiver is not owed any money" };
    }

    // Warning if settling more than owed (allow but warn)
    const maxSettlement = Math.min(Math.abs(fromBalance), toBalance);
    if (amount > maxSettlement + 0.01) {
        return { 
            valid: true, 
            warning: `Settlement amount (${amount.toFixed(2)}) exceeds suggested amount (${maxSettlement.toFixed(2)})` 
        };
    }

    return { valid: true };
};

/**
 * Get suggested settlements for a specific user
 * @param {String} userId - User ID
 * @param {Array} allSettlements - All simplified settlements
 * @returns {Array} Settlements involving this user
 */
const getUserSettlements = (userId, allSettlements) => {
    return allSettlements.filter(
        settlement => settlement.from._id === userId || settlement.to._id === userId
    );
};

export {
    calculateBalances,
    simplifyDebts,
    validateSettlement,
    getUserSettlements
};
