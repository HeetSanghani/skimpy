/**
 * LazyImage — fade-in image with IntersectionObserver.
 * Falls back gracefully if observer is not supported.
 *
 * Usage:
 *   <LazyImage src={url} alt="product" className="w-full h-full object-cover" />
 */
import { useRef, useState, useEffect } from "react";

export default function LazyImage({ src, alt = "", className = "", fallback = null, ...rest }) {
    const imgRef = useRef(null);
    const [visible, setVisible] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [errored, setErrored] = useState(false);

    // IntersectionObserver — only start loading when near viewport
    useEffect(() => {
        const el = imgRef.current;
        if (!el) return;

        if (!("IntersectionObserver" in window)) {
            setVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.unobserve(el);
                }
            },
            { rootMargin: "200px" } // preload 200px before entering view
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const showFallback = errored && fallback;

    return (
        <div ref={imgRef} className={`relative overflow-hidden ${className}`} {...rest}>
            {/* Shimmer placeholder while loading */}
            {!loaded && !showFallback && (
                <div className="absolute inset-0 skeleton" aria-hidden="true" />
            )}

            {/* Actual image — only rendered when near viewport */}
            {visible && !showFallback && (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setLoaded(true)}
                    onError={() => setErrored(true)}
                    className={`
            w-full h-full object-cover
            transition-opacity duration-500 ease-out
            ${loaded ? "opacity-100" : "opacity-0"}
          `}
                />
            )}

            {/* Fallback content */}
            {showFallback && fallback}
        </div>
    );
}
