/**
 * EmptyState — reusable empty-state component.
 * Usage:
 *   <EmptyState icon="📦" title="No products yet" subtitle="Check back soon!" />
 *   <EmptyState icon="🛒" title="Your cart is empty" cta={{ label: "Shop Now", to: "/products" }} />
 */
import { Link } from "react-router-dom";

export default function EmptyState({
    icon = "📭",
    title = "Nothing here yet",
    subtitle = "",
    cta = null, // { label: string, to?: string, onClick?: fn }
    dark = false,
}) {
    const bg = dark
        ? "bg-white/5 border-white/10 text-gray-400"
        : "bg-white border-gray-100 text-gray-400";

    return (
        <div
            className={`w-full rounded-2xl border ${bg} py-16 px-6 flex flex-col items-center justify-center text-center`}
            role="status"
            aria-label={title}
        >
            <div className="text-5xl mb-4 select-none" aria-hidden="true">{icon}</div>
            <h3 className={`font-sora font-bold text-lg mb-2 ${dark ? "text-white" : "text-gray-700"}`}>
                {title}
            </h3>
            {subtitle && (
                <p className="text-sm mb-6 max-w-xs">{subtitle}</p>
            )}
            {cta && (
                cta.to ? (
                    <Link
                        to={cta.to}
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-full text-sm hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 hover:scale-105"
                    >
                        {cta.label}
                    </Link>
                ) : (
                    <button
                        onClick={cta.onClick}
                        className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-full text-sm hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 hover:scale-105"
                    >
                        {cta.label}
                    </button>
                )
            )}
        </div>
    );
}
