/**
 * TopProgressBar — YouTube/GitHub-style thin loading bar at the top of the page.
 * Driven by the global LoadingContext.
 * Animates to 90% while loading, then fills to 100% and fades out on completion.
 */
import { useEffect, useState, useRef } from "react";
import { useLoading } from "../context/LoadingContext";

export default function TopProgressBar() {
    const { isLoading } = useLoading();
    const [progress, setProgress] = useState(0);
    const [visible, setVisible] = useState(false);
    const [fading, setFading] = useState(false);
    const timerRef = useRef(null);
    const rafRef = useRef(null);

    useEffect(() => {
        if (isLoading) {
            // Reset and start
            setFading(false);
            setVisible(true);
            setProgress(0);

            // Ease toward 90% — each tick adds a diminishing amount
            let current = 0;
            const tick = () => {
                current += (90 - current) * 0.06;
                setProgress(Math.min(current, 89));
                rafRef.current = requestAnimationFrame(tick);
            };
            rafRef.current = requestAnimationFrame(tick);
        } else {
            // Complete to 100%
            cancelAnimationFrame(rafRef.current);
            setProgress(100);
            // Fade out after fill completes
            timerRef.current = setTimeout(() => {
                setFading(true);
                timerRef.current = setTimeout(() => {
                    setVisible(false);
                    setProgress(0);
                }, 400);
            }, 300);
        }

        return () => {
            cancelAnimationFrame(rafRef.current);
            clearTimeout(timerRef.current);
        };
    }, [isLoading]);

    if (!visible) return null;

    return (
        <div
            role="progressbar"
            aria-label="Page loading"
            style={{ opacity: fading ? 0 : 1, transition: "opacity 0.4s ease" }}
            className="fixed top-0 left-0 right-0 z-[10000] h-[3px] bg-transparent pointer-events-none"
        >
            <div
                style={{
                    width: `${progress}%`,
                    transition: progress === 100 ? "width 0.3s ease" : "width 0.1s linear",
                    boxShadow: "0 0 8px rgba(99,102,241,0.8), 0 0 2px rgba(147,51,234,0.6)",
                }}
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-r-full"
            />
        </div>
    );
}
