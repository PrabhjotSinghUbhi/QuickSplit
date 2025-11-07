import { X, User, Calendar, Tag, FileText, Users, DollarSign, TrendingUp, UtensilsCrossed, Car, Film, ShoppingBag, Home, Zap, Heart, Plane, GraduationCap, Dumbbell, ArrowRightLeft, MoreHorizontal } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../store/slices/uiSlice";
import { formatCurrency, formatDate } from "../utils/helpers";

// Category icon mapping
const categoryIcons = {
  'Food': UtensilsCrossed,
  'Transportation': Car,
  'Entertainment': Film,
  'Shopping': ShoppingBag,
  'Housing': Home,
  'Utilities': Zap,
  'Healthcare': Heart,
  'Travel': Plane,
  'Education': GraduationCap,
  'Fitness': Dumbbell,
  'Settlement': ArrowRightLeft,
  'Other': MoreHorizontal
};

const ExpenseDetailModal = () => {
    const dispatch = useDispatch();
    const { modals } = useSelector((state) => state.ui);
    const { selectedExpense } = useSelector((state) => state.expenses);
    const { groups } = useSelector((state) => state.groups);

    if (!modals.expenseDetail || !selectedExpense) return null;

    const handleClose = () => {
        dispatch(closeModal("expenseDetail"));
    };

    // Safely access expense properties
    const expenseGroup = selectedExpense.group || selectedExpense.groupId;
    const group = groups?.find(g => g._id === expenseGroup);
    const currency = selectedExpense.currency || group?.baseCurrency || "INR";
    const splitBetween = selectedExpense.splitBetween || [];
    const splitDetails = selectedExpense.splitDetails || [];
    const splitType = selectedExpense.splitType || "equal";

    // Helper function to compare IDs
    const isSameId = (id1, id2) => {
        const str1 = (id1?._id || id1)?.toString();
        const str2 = (id2?._id || id2)?.toString();
        return str1 === str2;
    };

    // Helper function to get user name from group members
    const getUserName = (userId) => {
        if (!group?.members) return "Unknown";
        
        const member = group.members.find(m => {
            const memberId = m.userId?._id || m.userId || m._id;
            const targetId = userId?._id || userId;
            return isSameId(memberId, targetId);
        });
        
        if (member) {
            return member.userId?.fullName || member.userId?.name || member.fullName || member.name || "Unknown";
        }
        
        // If not found in members, check if userId itself has a name
        return userId?.fullName || userId?.name || "Unknown";
    };

    // Get split information
    const getSplitInfo = () => {
        try {
            switch (splitType) {
                case "equal":
                    return {
                        label: "Equal Split",
                        description: `Split equally among ${splitBetween.length} people`,
                        details: splitBetween.map(userId => {
                            const amount = selectedExpense.amount / splitBetween.length;
                            return {
                                name: getUserName(userId),
                                amount: amount,
                                percentage: 100 / splitBetween.length
                            };
                        })
                    };
                
                case "percentage":
                    return {
                        label: "Percentage Split",
                        description: "Split by custom percentages",
                        details: splitDetails.map(detail => {
                            return {
                                name: getUserName(detail.userId),
                                amount: (selectedExpense.amount * detail.percentage) / 100,
                                percentage: detail.percentage
                            };
                        })
                    };
                
                case "custom":
                    return {
                        label: "Custom Split",
                        description: "Split by custom amounts",
                        details: splitDetails.map(detail => {
                            return {
                                name: getUserName(detail.userId),
                                amount: detail.amount,
                                percentage: (detail.amount / selectedExpense.amount) * 100
                            };
                        })
                    };
                
                case "settlement":
                    return {
                        label: "Settlement",
                        description: "Payment between members",
                        details: splitBetween.map(userId => {
                            return {
                                name: getUserName(userId),
                                amount: selectedExpense.amount,
                                percentage: 100
                            };
                        })
                    };
                
                default:
                    return {
                        label: "Unknown Split",
                        description: "Split type unknown",
                        details: []
                    };
            }
        } catch (error) {
            console.error("Error in getSplitInfo:", error);
            return {
                label: "Error",
                description: "Unable to load split details",
                details: []
            };
        }
    };

    const splitInfo = getSplitInfo();
    const paidByName = selectedExpense.paidBy?.name || selectedExpense.paidBy?.fullName || "Unknown";

    try {
        return (
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            >
                <div className="w-full h-full flex items-center justify-center p-4 overflow-y-auto">
                    <div 
                        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 my-8 animate-fadeIn max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6 pb-4 border-b border-gray-200">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                {selectedExpense.description || "Expense Details"}
                            </h2>
                            {group && (
                                <div className="flex items-center text-sm text-gray-600">
                                    <Users className="w-4 h-4 mr-1" />
                                    <span>{group.name}</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-4"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Amount Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                                <p className="text-4xl font-bold text-gray-900">
                                    {formatCurrency(selectedExpense.amount, currency)}
                                </p>
                            </div>
                            <div className={`p-4 rounded-full ${
                                selectedExpense.isSettlement 
                                    ? 'bg-purple-100' 
                                    : 'bg-blue-100'
                            }`}>
                                <DollarSign className={`w-8 h-8 ${
                                    selectedExpense.isSettlement 
                                        ? 'text-purple-600' 
                                        : 'text-blue-600'
                                }`} />
                            </div>
                        </div>
                    </div>

                    {/* Expense Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Paid By */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center text-gray-600 mb-2">
                                <User className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">Paid By</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-900">{paidByName}</p>
                        </div>

                        {/* Category */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center text-gray-600 mb-2">
                                <Tag className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">Category</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {(() => {
                                    const category = selectedExpense.category || "Other";
                                    const IconComponent = categoryIcons[category] || MoreHorizontal;
                                    return <IconComponent className="w-5 h-5 text-blue-600" />;
                                })()}
                                <p className="text-lg font-semibold text-gray-900">
                                    {selectedExpense.category || "Other"}
                                </p>
                            </div>
                        </div>

                        {/* Date */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center text-gray-600 mb-2">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">Date</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-900">
                                {formatDate(selectedExpense.date)}
                            </p>
                        </div>

                        {/* Split Type */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center text-gray-600 mb-2">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">Split Type</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-900">{splitInfo.label}</p>
                        </div>
                    </div>

                    {/* Notes */}
                    {selectedExpense.notes && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <div className="flex items-center text-gray-600 mb-2">
                                <FileText className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">Notes</span>
                            </div>
                            <p className="text-gray-700">{selectedExpense.notes}</p>
                        </div>
                    )}

                    {/* Split Details */}
                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Split Details</h3>
                        <p className="text-sm text-gray-600 mb-4">{splitInfo.description}</p>
                        
                        <div className="space-y-3">
                            {splitInfo.details.map((detail, index) => (
                                <div 
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                            {detail.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{detail.name}</p>
                                            {selectedExpense.splitType !== "equal" && (
                                                <p className="text-sm text-gray-600">
                                                    {detail.percentage.toFixed(1)}% of total
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-gray-900">
                                            {formatCurrency(detail.amount, currency)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
                        <button
                            onClick={handleClose}
                            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
        );
    } catch (error) {
        console.error("Error rendering ExpenseDetailModal:", error);
        return (
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            >
                <div className="w-full h-full flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 text-center">
                        <h2 className="text-xl font-bold text-red-600 mb-4">Error Loading Expense</h2>
                        <p className="text-gray-600 mb-4">Unable to display expense details.</p>
                        <button
                            onClick={handleClose}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }
};

export default ExpenseDetailModal;
