/**
 * Skeleton Loaders — reusable shimmer placeholders for data loading states.
 *
 * Exports:
 *   SkeletonCard          — product card skeleton
 *   SkeletonGrid          — 8 SkeletonCards in a grid
 *   SkeletonTable         — table rows skeleton
 *   SkeletonDashboardCard — stat card skeleton
 *   SkeletonDashboardGrid — 4 stat cards
 *   SkeletonList          — vertical list of rows (orders, etc.)
 *   SkeletonText          — generic text line(s)
 *   SkeletonProductDetail — full product detail page skeleton
 */

/* Shimmer base class — used on every skeleton element */
const shimmer = `
  relative overflow-hidden bg-white/8 rounded
  before:absolute before:inset-0
  before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent
  before:animate-[shimmer_1.6s_ease-in-out_infinite]
`.trim();

/* ─── Primitive ────────────────────────────────────────────────────────────── */
function Bone({ className = "" }) {
    return <div className={`${shimmer} ${className}`} />;
}

/* ─── Product Card Skeleton ────────────────────────────────────────────────── */
export function SkeletonCard() {
    return (
        <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
            {/* Image */}
            <Bone className="h-48 w-full rounded-none" />
            {/* Body */}
            <div className="p-4 space-y-3">
                <Bone className="h-4 w-3/4" />
                <Bone className="h-3 w-1/2" />
                <div className="flex items-center justify-between pt-1">
                    <Bone className="h-5 w-16" />
                    <Bone className="h-8 w-20 rounded-xl" />
                </div>
            </div>
        </div>
    );
}

/* ─── Grid of 8 Cards ──────────────────────────────────────────────────────── */
export function SkeletonGrid({ count = 8 }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

/* ─── Table Skeleton ───────────────────────────────────────────────────────── */
export function SkeletonTable({ rows = 6, cols = 4 }) {
    return (
        <div className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/8 flex gap-4">
                {Array.from({ length: cols }).map((_, i) => (
                    <Bone key={i} className="h-4 flex-1" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, ri) => (
                <div key={ri} className="px-6 py-4 border-b border-white/6 flex gap-4 items-center">
                    <Bone className="h-8 w-8 rounded-full flex-shrink-0" />
                    {Array.from({ length: cols - 1 }).map((_, ci) => (
                        <Bone key={ci} className={`h-3 flex-1 ${ci === 0 ? "w-2/5" : ""}`} />
                    ))}
                </div>
            ))}
        </div>
    );
}

/* ─── Dashboard Stat Card ──────────────────────────────────────────────────── */
export function SkeletonDashboardCard() {
    return (
        <div className="bg-[#111] border border-white/8 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-4">
                <Bone className="h-10 w-10 rounded-xl" />
                <Bone className="h-5 w-12 rounded-full" />
            </div>
            <Bone className="h-8 w-20 mb-2" />
            <Bone className="h-3 w-28" />
        </div>
    );
}

export function SkeletonDashboardGrid({ count = 4 }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonDashboardCard key={i} />
            ))}
        </div>
    );
}

/* ─── List Skeleton (orders, wishlist, etc.) ───────────────────────────────── */
export function SkeletonList({ rows = 5 }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="bg-[#111] border border-white/8 rounded-2xl p-4 flex items-center gap-4">
                    <Bone className="h-14 w-14 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <Bone className="h-4 w-3/4" />
                        <Bone className="h-3 w-1/2" />
                    </div>
                    <Bone className="h-8 w-20 rounded-xl flex-shrink-0" />
                </div>
            ))}
        </div>
    );
}

/* ─── Text Lines ───────────────────────────────────────────────────────────── */
export function SkeletonText({ lines = 3 }) {
    const widths = ["w-full", "w-5/6", "w-4/5", "w-3/4", "w-2/3"];
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Bone key={i} className={`h-3 ${widths[i % widths.length]}`} />
            ))}
        </div>
    );
}

/* ─── Product Detail Skeleton ──────────────────────────────────────────────── */
export function SkeletonProductDetail() {
    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Image */}
                <Bone className="h-96 w-full rounded-2xl" />
                {/* Details */}
                <div className="space-y-5">
                    <Bone className="h-6 w-1/3" />
                    <Bone className="h-8 w-4/5" />
                    <Bone className="h-5 w-1/4" />
                    <div className="space-y-2 pt-2">
                        <Bone className="h-3 w-full" />
                        <Bone className="h-3 w-5/6" />
                        <Bone className="h-3 w-4/5" />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Bone className="h-12 flex-1 rounded-xl" />
                        <Bone className="h-12 flex-1 rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Profile Skeleton ─────────────────────────────────────────────────────── */
export function SkeletonProfile() {
    return (
        <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
            <div className="flex items-center gap-4">
                <Bone className="h-20 w-20 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Bone className="h-5 w-40" />
                    <Bone className="h-4 w-56" />
                </div>
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                    <Bone className="h-3 w-24" />
                    <Bone className="h-11 w-full rounded-xl" />
                </div>
            ))}
        </div>
    );
}

/* ─── Full-page skeleton (generic fallback) ────────────────────────────────── */
export function SkeletonPage() {
    return (
        <div className="min-h-[60vh] flex flex-col gap-6 p-6">
            <div className="flex gap-3 items-center">
                <Bone className="h-8 w-48" />
                <Bone className="h-8 w-8 rounded-full" />
            </div>
            <SkeletonGrid count={6} />
        </div>
    );
}
