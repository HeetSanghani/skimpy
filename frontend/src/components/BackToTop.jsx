/**
 * BackToTop — floating button that appears after scrolling 400px.
 * Smooth-scrolls back to top on click.
 */
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 400);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    if (!visible) return null;

    return (
        <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full
                 bg-gradient-to-br from-indigo-600 to-purple-600
                 text-white flex items-center justify-center
                 shadow-lg shadow-indigo-900/40
                 hover:scale-110 hover:shadow-indigo-700/50
                 transition-all duration-200 animate-[fadeIn_0.3s_ease-in]"
        >
            <ArrowUp size={18} strokeWidth={2.5} />
        </button>
    );
}
