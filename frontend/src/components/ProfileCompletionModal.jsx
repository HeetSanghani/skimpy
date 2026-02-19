import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, X } from 'lucide-react';

const ProfileCompletionModal = ({ isOpen, onClose, missingFields }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="text-center">
                    <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                        <ClipboardList className="w-8 h-8 text-indigo-400" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 font-sora">Complete Your Profile</h3>
                    <p className="text-gray-400 mb-6 text-sm">
                        Please complete your profile details before proceeding.
                    </p>

                    <div className="text-left bg-white/5 border border-white/10 p-4 rounded-xl mb-6">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Required Fields</p>
                        <ul className="space-y-2">
                            {missingFields.map((field, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-rose-400 text-sm font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    {field}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <button
                        onClick={() => {
                            onClose();
                            navigate('/profile');
                        }}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 transform hover:scale-[1.02]"
                    >
                        Complete Profile Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileCompletionModal;
