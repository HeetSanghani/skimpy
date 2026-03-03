/**
 * SkeletonCard — product-card-shaped shimmer placeholder.
 * Used in Products.jsx and anywhere a product grid loads.
 */
export default function SkeletonCard() {
    return (
        <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm animate-pulse">
            {/* Image area */}
            <div className="aspect-[4/5] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 skeleton" />
            {/* Content */}
            <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded-full w-3/4 skeleton" />
                <div className="h-3 bg-gray-200 rounded-full w-1/2 skeleton" />
                <div className="h-5 bg-gray-200 rounded-full w-1/3 skeleton mt-2" />
                <div className="flex gap-2 mt-3">
                    <div className="h-8 bg-gray-200 rounded-full flex-1 skeleton" />
                    <div className="h-8 w-8 bg-gray-200 rounded-full skeleton" />
                </div>
            </div>
        </div>
    );
}

/**
 * SkeletonGrid — renders N skeleton cards in a responsive grid.
 */
export function SkeletonGrid({ count = 8 }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}
