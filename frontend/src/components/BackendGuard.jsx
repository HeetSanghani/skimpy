import { useEffect, useState, useRef, useCallback } from "react";
import { API_BASE_URL } from "../api/baseUrl";

/* ─── Config ────────────────────────────────────────────────────── */
const POLL_INTERVAL_MS = 3000;   // check every 3 seconds
const TIMEOUT_WARNING = 20000;  // show "taking longer" after 20s
const MAX_TIMEOUT_MS = 90000;  // stop after 90s and show error

/* ─── Status messages – cycle while waiting ─────────────────────── */
const STATUS_MESSAGES = [
    "Starting services…",
    "Preparing your experience…",
    "Connecting to server…",
    "Waking up backend…",
    "Almost ready…",
    "Loading marketplace data…",
    "Warming up the engines…",
];

export default function BackendGuard({ children }) {
    const [phase, setPhase] = useState("checking"); // "checking" | "ready" | "timeout"
    const [msgIdx, setMsgIdx] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [fadeOut, setFadeOut] = useState(false);

    const intervalRef = useRef(null);
    const msgTimerRef = useRef(null);
    const elapsedRef = useRef(null);
    const startRef = useRef(Date.now());
    const resolvedRef = useRef(false);

    /* Cycle through status messages every 3.5s */
    const startMsgCycle = useCallback(() => {
        msgTimerRef.current = setInterval(() => {
            setMsgIdx(prev => (prev + 1) % STATUS_MESSAGES.length);
        }, 3500);
    }, []);

    /* Track elapsed seconds */
    const startClock = useCallback(() => {
        elapsedRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
        }, 1000);
    }, []);

    const clearAll = useCallback(() => {
        clearInterval(intervalRef.current);
        clearInterval(msgTimerRef.current);
        clearInterval(elapsedRef.current);
    }, []);

    /* Ping /health */
    const checkHealth = useCallback(async () => {
        if (resolvedRef.current) return;
        try {
            const resp = await fetch(`${API_BASE_URL}/health`, {
                method: "GET",
                signal: AbortSignal.timeout(5000), // 5s per request
            });
            if (resp.ok) {
                resolvedRef.current = true;
                clearAll();
                // Smooth fade-out before mounting children
                setFadeOut(true);
                setTimeout(() => setPhase("ready"), 600);
            }
        } catch (_) {
            /* not ready yet — keep polling */
        }
    }, [clearAll]);

    useEffect(() => {
        startMsgCycle();
        startClock();

        // 1st check immediately
        checkHealth();
        // then poll every POLL_INTERVAL_MS
        intervalRef.current = setInterval(checkHealth, POLL_INTERVAL_MS);

        // Max timeout
        const maxTimer = setTimeout(() => {
            if (!resolvedRef.current) {
                clearAll();
                setPhase("timeout");
            }
        }, MAX_TIMEOUT_MS);

        return () => {
            clearAll();
            clearTimeout(maxTimer);
        };
    }, [checkHealth, clearAll, startMsgCycle, startClock]);

    /* ── Healthy — render the app ── */
    if (phase === "ready") return children;

    const isSlowWarning = elapsed >= TIMEOUT_WARNING / 1000;

    /* ── Timeout screen ── */
    if (phase === "timeout") {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
                <div className="text-5xl mb-6">⚠️</div>
                <h1 className="text-2xl font-bold text-white mb-3">Server Unavailable</h1>
                <p className="text-gray-400 text-sm max-w-sm mb-8 leading-relaxed">
                    The backend is taking longer than expected. This may be a temporary outage.
                    Please try again in a moment.
                </p>
                <button
                    onClick={() => { resolvedRef.current = false; setPhase("checking"); setElapsed(0); startRef.current = Date.now(); startMsgCycle(); startClock(); checkHealth(); intervalRef.current = setInterval(checkHealth, POLL_INTERVAL_MS); }}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all duration-200"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    /* ── Loading screen ── */
    return (
        <div
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0a0a] px-6 transition-opacity duration-500 ${fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
            {/* Background gradient orbs */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-purple-600/8 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col items-center gap-8">

                {/* ── Animated Logo Ring ── */}
                <div className="relative flex items-center justify-center">
                    {/* Outer slow-spin ring */}
                    <div className="absolute w-24 h-24 rounded-full border-2 border-indigo-500/20 animate-[spin_8s_linear_infinite]" />
                    {/* Mid pulse ring */}
                    <div className="absolute w-20 h-20 rounded-full border border-purple-500/30 animate-[ping_2s_ease-in-out_infinite]" />
                    {/* Inner fast-spin arc */}
                    <div className="absolute w-16 h-16 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
                    {/* Logo center */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
                        <span className="text-white font-black text-lg">S</span>
                    </div>
                </div>

                {/* Brand name */}
                <div className="text-center">
                    <h1 className="text-3xl font-black tracking-[0.3em] bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        SKIMPY
                    </h1>
                    <p className="text-gray-600 text-xs tracking-widest mt-1 uppercase">Marketplace</p>
                </div>

                {/* ── Animated progress bar ── */}
                <div className="w-64 h-1 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" />
                </div>

                {/* Status message */}
                <div className="text-center h-6">
                    <p
                        key={msgIdx}
                        className="text-gray-400 text-sm animate-[fadeIn_0.4s_ease-in]"
                    >
                        {STATUS_MESSAGES[msgIdx]}
                    </p>
                </div>

                {/* Slow warning */}
                {isSlowWarning && (
                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 text-amber-400 text-xs animate-[fadeIn_0.4s_ease-in]">
                        <span>🕐</span>
                        <span>Server is taking longer than usual ({elapsed}s). Render free-tier is waking up…</span>
                    </div>
                )}

                {/* Dots indicator */}
                <div className="flex gap-2">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                            style={{ animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
