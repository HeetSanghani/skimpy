/**
 * RouteChangeLoader — fires startLoading on every React Router navigation,
 * then stopLoading after a short settle time.
 * Must be rendered inside <Router> and <LoadingProvider>.
 */
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useLoading } from "../context/LoadingContext";

export default function RouteChangeLoader() {
    const location = useLocation();
    const { startLoading, stopLoading } = useLoading();
    const timerRef = useRef(null);
    const firstRef = useRef(true); // skip very first mount

    useEffect(() => {
        if (firstRef.current) {
            firstRef.current = false;
            return;
        }

        startLoading();
        clearTimeout(timerRef.current);

        // Give the new page's components ~400ms to begin rendering
        timerRef.current = setTimeout(() => {
            stopLoading();
        }, 400);

        return () => clearTimeout(timerRef.current);
    }, [location.pathname, location.search]);

    return null; // renders nothing — side-effects only
}
