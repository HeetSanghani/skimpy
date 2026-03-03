/**
 * ScrollToTop — scrolls the window to the top on every route change.
 * Prevents new pages from starting mid-scroll.
 */
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
    }, [pathname]);
    return null;
}
