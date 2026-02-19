import React from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "info" // "danger" | "info" | "success"
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-[#111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 opacity-100">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${type === 'danger' ? 'bg-red-500/10 text-red-500' :
                                type === 'success' ? 'bg-green-500/10 text-green-500' :
                                    'bg-indigo-500/10 text-indigo-500'
                            }`}>
                            {type === 'danger' ? <AlertTriangle size={20} /> : <Info size={20} />}
                        </div>
                        <h3 className="text-lg font-bold text-white">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-300 leading-relaxed text-sm">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-5 border-t border-white/5 bg-white/[0.02]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors border border-transparent"
                    >
                        {cancelText}
                    </button>

                    <button
                        onClick={onConfirm}
                        className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-lg transition-all transform hover:scale-105 ${type === 'danger'
                                ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20'
                                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
