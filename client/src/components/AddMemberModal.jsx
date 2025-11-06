import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Mail, User } from "lucide-react";
import toast from 'react-hot-toast';
import { addMember } from "../store/slices/groupSlice";
import { closeModal } from "../store/slices/uiSlice";

const AddMemberModal = () => {
    const dispatch = useDispatch();
    const { modals } = useSelector((state) => state.ui);
    const { currentGroup } = useSelector((state) => state.groups);

    const [formData, setFormData] = useState({
        email: "",
        name: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (modals.addMember) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [modals.addMember]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (!currentGroup) {
                throw new Error("No group selected");
            }

            // Backend expects just email or userId, not name
            await dispatch(
                addMember({
                    groupId: currentGroup._id,
                    memberData: {
                        email: formData.email
                    }
                })
            ).unwrap();

            toast.success('Member added successfully!');
            handleClose();
        } catch (err) {
            setError(err.message || "Failed to add member");
            toast.error(err.message || "Failed to add member");
            console.error("Failed to add member:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ email: "", name: "" });
        setError("");
        dispatch(closeModal("addMember"));
    };

    if (!modals.addMember) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div className="w-full h-full flex items-center justify-center p-4 overflow-y-auto">
                <div
                    className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 my-8 animate-fadeIn max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Add Member
                        </h2>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Group Info */}
                    {currentGroup && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-gray-600">
                                Adding member to:
                            </p>
                            <p className="font-semibold text-gray-800">
                                {currentGroup.name}
                            </p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center space-x-2">
                                    <Mail className="w-4 h-4" />
                                    <span>Email Address *</span>
                                </div>
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        email: e.target.value
                                    })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="member@example.com"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Enter the email address of the person you want
                                to add
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center space-x-2">
                                    <User className="w-4 h-4" />
                                    <span>Name (Optional)</span>
                                </div>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value
                                    })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Member's name"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                If not provided, email will be used as the
                                display name
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Adding..." : "Add Member"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddMemberModal;
