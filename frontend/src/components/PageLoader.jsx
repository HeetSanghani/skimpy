import { useLoading } from "../context/LoadingContext";

/**
 * Full-page loading overlay. Only renders when globalloading is active (after 200ms threshold).
 */
export default function PageLoader() {
    const { isLoading } = useLoading();

    if (!isLoading) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] bg-[#0a0a0a]/80 backdrop-blur-sm flex flex-col items-center justify-center"
            role="status"
            aria-label="Loading"
        >
            {/* Spinner ring */}
            <div className="relative flex items-center justify-center mb-4">
                <div className="w-14 h-14 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <div className="absolute w-9 h-9 rounded-full border-4 border-purple-500/20 border-b-purple-500 animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
            </div>
            {/* SKIMPY wordmark */}
            <span className="font-sora font-extrabold text-sm bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent tracking-widest uppercase">
                SKIMPY
            </span>
            <p className="text-gray-500 text-xs mt-1">Loading…</p>
        </div>
    );
}
