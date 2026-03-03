/**
 * Global loading context with 200ms threshold.
 * Loaders only appear if the operation takes > 200ms, preventing flicker.
 */
import { createContext, useContext, useState, useRef, useCallback } from "react";

const LoadingContext = createContext(null);

export function LoadingProvider({ children }) {
    const [isLoading, setIsLoading] = useState(false);
    const timerRef = useRef(null);
    const countRef = useRef(0); // track concurrent loading ops

    const startLoading = useCallback(() => {
        countRef.current += 1;
        if (timerRef.current) return; // already counting
        timerRef.current = setTimeout(() => {
            if (countRef.current > 0) {
                setIsLoading(true);
            }
        }, 200); // only show if > 200ms
    }, []);

    const stopLoading = useCallback(() => {
        countRef.current = Math.max(0, countRef.current - 1);
        if (countRef.current === 0) {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            setIsLoading(false);
        }
    }, []);

    return (
        <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const ctx = useContext(LoadingContext);
    if (!ctx) throw new Error("useLoading must be used within <LoadingProvider>");
    return ctx;
}
