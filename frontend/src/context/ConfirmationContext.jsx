import React, { createContext, useContext, useState, useCallback } from "react";
import ConfirmationModal from "../components/ConfirmationModal";

const ConfirmationContext = createContext();

export const useConfirmation = () => useContext(ConfirmationContext);

export const ConfirmationProvider = ({ children }) => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: "",
        message: "",
        confirmText: "Confirm",
        cancelText: "Cancel",
        type: "info", // or "danger"
        onConfirm: () => { },
        onCancel: () => { },
    });

    const showConfirm = useCallback(({
        title = "Confirm Action",
        message = "Are you sure you want to proceed?",
        confirmText = "Confirm",
        cancelText = "Cancel",
        type = "info",
        onConfirm = () => { },
        onCancel = () => { }
    }) => {
        setModalState({
            isOpen: true,
            title,
            message,
            confirmText,
            cancelText,
            type,
            onConfirm,
            onCancel,
        });
    }, []);

    const closeConfirm = useCallback(() => {
        setModalState((prev) => ({ ...prev, isOpen: false }));
    }, []);

    const handleConfirm = useCallback(() => {
        if (modalState.onConfirm) modalState.onConfirm();
        closeConfirm();
    }, [modalState, closeConfirm]);

    const handleCancel = useCallback(() => {
        if (modalState.onCancel) modalState.onCancel();
        closeConfirm();
    }, [modalState, closeConfirm]);

    return (
        <ConfirmationContext.Provider value={{ showConfirm, closeConfirm }}>
            {children}
            <ConfirmationModal
                isOpen={modalState.isOpen}
                title={modalState.title}
                message={modalState.message}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                type={modalState.type}
                onConfirm={handleConfirm}
                onClose={handleCancel}
            />
        </ConfirmationContext.Provider>
    );
};
