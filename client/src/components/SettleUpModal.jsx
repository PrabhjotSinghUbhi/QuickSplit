import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, ArrowRight, CheckCircle } from "lucide-react";
import toast from 'react-hot-toast';
import { closeModal } from "../store/slices/uiSlice";
import { settleUp, fetchBalances } from "../store/slices/groupSlice";
import { fetchExpenses } from "../store/slices/expenseSlice";
import { formatCurrency } from "../utils/helpers";

const SettleUpModal = () => {
    const dispatch = useDispatch();
    const { modals } = useSelector((state) => state.ui);
    const { currentGroup, settlements: groupSettlements } = useSelector((state) => state.groups);
    const { user } = useSelector((state) => state.auth);

    const [loading, setLoading] = useState(false);
    const [selectedSettlement, setSelectedSettlement] = useState(null);
    const [showAllSettlements, setShowAllSettlements] = useState(false);

    // Get settlements from backend (single source of truth)
    const allSettlements = groupSettlements[currentGroup?._id] || [];

    // Filter settlements involving the current user
    const userSettlements = allSettlements.filter(
        s => s.from._id === user._id || s.to._id === user._id
    );

    // Use either all settlements or just user settlements based on toggle
    const settlements = showAllSettlements ? allSettlements : userSettlements;

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (modals.settleUp) {
            document.body.style.overflow = "hidden";
            setSelectedSettlement(null);
            setShowAllSettlements(false);
            
            // Fetch latest settlements from backend
            if (currentGroup?._id) {
                dispatch(fetchBalances(currentGroup._id));
            }
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [modals.settleUp, currentGroup, dispatch]);

    const handleClose = () => {
        setSelectedSettlement(null);
        dispatch(closeModal("settleUp"));
    };

    const handleSettleUp = async (settlement) => {
        setLoading(true);
        try {
            if (!currentGroup) {
                throw new Error("No group selected");
            }

            // Check if the current user is involved in this settlement
            const isUserInvolved = settlement.from._id === user._id || settlement.to._id === user._id;
            if (!isUserInvolved) {
                toast.error('You can only record settlements that involve you');
                setLoading(false);
                return;
            }

            await dispatch(
                settleUp({
                    groupId: currentGroup._id,
                    from: settlement.from._id,
                    to: settlement.to._id,
                    amount: settlement.amount
                })
            ).unwrap();

            // Refresh expenses list to show the settlement
            await dispatch(fetchExpenses(currentGroup._id));

            toast.success('Settlement recorded successfully!');
            handleClose();
        } catch (err) {
            toast.error(err.message || "Failed to settle up");
            console.error("Failed to settle up:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!modals.settleUp) return null;

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
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Settle Up</h2>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            disabled={loading}
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        {allSettlements.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <p className="text-lg font-semibold text-gray-900 mb-2">All Settled!</p>
                                <p className="text-gray-600">Everyone is settled up in this group.</p>
                            </div>
                        ) : (
                            <>
                                {/* Toggle button */}
                                {userSettlements.length > 0 && allSettlements.length > userSettlements.length && (
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                        <p className="text-sm text-gray-600">
                                            {showAllSettlements 
                                                ? 'Showing all group settlements'
                                                : 'Showing your settlements only'}
                                        </p>
                                        <button
                                            onClick={() => {
                                                setShowAllSettlements(!showAllSettlements);
                                                setSelectedSettlement(null);
                                            }}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            {showAllSettlements ? 'Show mine only' : 'Show all'}
                                        </button>
                                    </div>
                                )}

                                {settlements.length === 0 ? (
                                    <div className="text-center py-8">
                                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                        <p className="text-lg font-semibold text-gray-900 mb-2">You're Settled!</p>
                                        <p className="text-gray-600">You don't have any pending settlements.</p>
                                        {allSettlements.length > 0 && (
                                            <button
                                                onClick={() => setShowAllSettlements(true)}
                                                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                View all group settlements
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm text-gray-600">
                                            Select a settlement to record the payment:
                                        </p>

                                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                            {settlements.map((settlement, index) => {
                                                const isUserPayer = settlement.from._id === user._id;
                                                const isUserReceiver = settlement.to._id === user._id;
                                                const isUserInvolved = isUserPayer || isUserReceiver;

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`border-2 rounded-lg p-4 transition-all ${
                                                            !isUserInvolved 
                                                                ? 'border-gray-200 bg-gray-50 opacity-75 cursor-not-allowed'
                                                                : selectedSettlement === index
                                                                    ? 'border-blue-500 bg-blue-50 cursor-pointer'
                                                                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 cursor-pointer'
                                                        }`}
                                                        onClick={() => isUserInvolved && setSelectedSettlement(index)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-3">
                                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${
                                                                    isUserPayer ? 'bg-red-500' : isUserReceiver ? 'bg-green-500' : 'bg-gray-400'
                                                                }`}>
                                                                    {(isUserPayer ? settlement.to.name : settlement.from.name)?.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className="font-semibold text-gray-900">
                                                                            {isUserPayer ? 'You' : settlement.from.name}
                                                                        </span>
                                                                        <ArrowRight className="w-4 h-4 text-gray-400" />
                                                                        <span className="font-semibold text-gray-900">
                                                                            {isUserReceiver ? 'You' : settlement.to.name}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-600 mt-1">
                                                                        {isUserPayer
                                                                            ? `You pay ${settlement.to.name}`
                                                                            : isUserReceiver
                                                                                ? `${settlement.from.name} pays you`
                                                                                : `${settlement.from.name} pays ${settlement.to.name}`}
                                                                    </p>
                                                                    {!isUserInvolved && (
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            (Not involving you)
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className={`text-lg font-bold ${
                                                                    isUserPayer ? 'text-red-600' : isUserReceiver ? 'text-green-600' : 'text-gray-600'
                                                                }`}>
                                                                    {formatCurrency(settlement.amount, currentGroup.baseCurrency)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {settlements.length > 0 && (
                        <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (selectedSettlement !== null) {
                                        handleSettleUp(settlements[selectedSettlement]);
                                    } else {
                                        toast.error('Please select a settlement');
                                    }
                                }}
                                disabled={loading || selectedSettlement === null}
                                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Recording...</span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        <span>Record Payment</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SettleUpModal;
