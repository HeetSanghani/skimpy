// SearchResults.jsx
import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { SkeletonGrid } from "../components/Skeletons";
import { API_BASE_URL } from "../api/baseUrl";
import { useSEO } from "../hooks/useSEO";
import { Search, SlidersHorizontal, X, ChevronDown, Tag, Package } from "lucide-react";

/* ── Highlight helper ── */
function Highlight({ text, query }) {
    if (!query || !text) return <span>{text}</span>;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = String(text).split(regex);
    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} className="bg-indigo-200/60 text-indigo-900 rounded px-0.5 font-semibold">
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
}

/* ── Filter pill ── */
function FilterPill({ label, onRemove }) {
    return (
        <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full">
            {label}
            <button onClick={onRemove} className="hover:text-indigo-900 transition-colors">
                <X size={12} />
            </button>
        </span>
    );
}

export default function SearchResults() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get("q") || "";

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filters
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [priceSort, setPriceSort] = useState(""); // "" | "asc" | "desc"
    const [showFilters, setShowFilters] = useState(false);
    const [localQuery, setLocalQuery] = useState(query);

    const timerRef = useRef(null);

    useSEO({
        title: query ? `"${query}" — Search Results | Skimpy` : "Search Products | Skimpy",
        description: `Search results for "${query}" on Skimpy Marketplace.`,
        url: `/search?q=${encodeURIComponent(query)}`,
    });

    // Fetch from backend search endpoint
    const fetchResults = useCallback(async (q) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/Product/search`, {
                params: { q: q.trim() },
            });
            setProducts(Array.isArray(res.data) ? res.data : []);
        } catch {
            setError("Failed to load search results. Please try again.");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchResults(query);
        setLocalQuery(query);
        setSelectedCategories([]);
        setSelectedBrands([]);
        setPriceSort("");
    }, [query, fetchResults]);

    // Derive unique categories & brands from results
    const allCategories = useMemo(() => {
        const s = new Set(products.map((p) => p.category_name).filter(Boolean));
        return [...s].sort();
    }, [products]);

    const allBrands = useMemo(() => {
        const s = new Set(products.map((p) => p.brand).filter(Boolean));
        return [...s].sort();
    }, [products]);

    // Apply local filters on top of server results
    const filteredProducts = useMemo(() => {
        let list = [...products];
        if (selectedCategories.length > 0) {
            list = list.filter((p) => selectedCategories.includes(p.category_name));
        }
        if (selectedBrands.length > 0) {
            list = list.filter((p) => selectedBrands.includes(p.brand));
        }
        if (priceSort === "asc") {
            list.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (priceSort === "desc") {
            list.sort((a, b) => (b.price || 0) - (a.price || 0));
        }
        return list;
    }, [products, selectedCategories, selectedBrands, priceSort]);

    // Search submit (from the in-page search bar)
    const handleSubmit = (e) => {
        e.preventDefault();
        if (localQuery.trim()) {
            setSearchParams({ q: localQuery.trim() });
        }
    };

    const toggleCategory = (cat) => {
        setSelectedCategories((prev) =>
            prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
        );
    };

    const toggleBrand = (brand) => {
        setSelectedBrands((prev) =>
            prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
        );
    };

    const clearAllFilters = () => {
        setSelectedCategories([]);
        setSelectedBrands([]);
        setPriceSort("");
    };

    const hasActiveFilters =
        selectedCategories.length > 0 || selectedBrands.length > 0 || priceSort !== "";

    return (
        <div className="flex flex-col min-h-screen bg-[#f8f8fc]">
            <Navbar />

            {/* ── Hero search bar ── */}
            <div className="w-full bg-gradient-to-r from-[#0f0a1e] via-[#1a0f3e] to-[#0a0a18] py-10 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <p className="text-indigo-400 text-xs font-bold tracking-widest uppercase mb-2">
                        Search Results
                    </p>
                    <h1 className="font-sora text-3xl md:text-4xl font-extrabold text-white mb-6 leading-tight">
                        {query ? (
                            <>
                                Results for{" "}
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                                    &ldquo;{query}&rdquo;
                                </span>
                            </>
                        ) : (
                            "Search Products"
                        )}
                    </h1>

                    {/* In-page search bar */}
                    <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5 pointer-events-none z-10" />
                        <input
                            type="search"
                            value={localQuery}
                            onChange={(e) => setLocalQuery(e.target.value)}
                            placeholder="Search products, brands, categories…"
                            style={{ caretColor: "#a5b4fc", colorScheme: "dark" }}
                            className="w-full pl-12 pr-36 py-4 rounded-2xl bg-[#1e1640] border border-indigo-500/30 text-white placeholder-gray-500 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400/60 transition-all shadow-inner"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-md"
                        >
                            Search
                        </button>
                    </form>
                </div>
            </div>

            <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex gap-8">
                    {/* ── Sidebar Filters (desktop) ── */}
                    <aside className="hidden lg:flex flex-col gap-6 w-60 shrink-0">
                        <FilterSidebar
                            allCategories={allCategories}
                            selectedCategories={selectedCategories}
                            toggleCategory={toggleCategory}
                            allBrands={allBrands}
                            selectedBrands={selectedBrands}
                            toggleBrand={toggleBrand}
                            priceSort={priceSort}
                            setPriceSort={setPriceSort}
                            clearAllFilters={clearAllFilters}
                            hasActiveFilters={hasActiveFilters}
                        />
                    </aside>

                    {/* ── Main Content ── */}
                    <div className="flex-1 min-w-0">
                        {/* Toolbar row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                            <div className="flex items-center gap-2">
                                {!loading && (
                                    <span className="text-gray-500 text-sm font-medium">
                                        <span className="font-bold text-gray-800">{filteredProducts.length}</span>{" "}
                                        {filteredProducts.length === 1 ? "product" : "products"} found
                                    </span>
                                )}
                                {/* Active filter pills */}
                                {selectedCategories.map((cat) => (
                                    <FilterPill key={cat} label={cat} onRemove={() => toggleCategory(cat)} />
                                ))}
                                {selectedBrands.map((b) => (
                                    <FilterPill key={b} label={b} onRemove={() => toggleBrand(b)} />
                                ))}
                                {priceSort && (
                                    <FilterPill
                                        label={priceSort === "asc" ? "Price: Low → High" : "Price: High → Low"}
                                        onRemove={() => setPriceSort("")}
                                    />
                                )}
                                {hasActiveFilters && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="text-xs text-rose-500 font-semibold hover:underline"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>

                            {/* Mobile filter toggle */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                <SlidersHorizontal size={16} />
                                Filters {hasActiveFilters && `(${selectedCategories.length + selectedBrands.length + (priceSort ? 1 : 0)})`}
                            </button>
                        </div>

                        {/* Mobile filter panel */}
                        {showFilters && (
                            <div className="lg:hidden mb-6 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <FilterSidebar
                                    allCategories={allCategories}
                                    selectedCategories={selectedCategories}
                                    toggleCategory={toggleCategory}
                                    allBrands={allBrands}
                                    selectedBrands={selectedBrands}
                                    toggleBrand={toggleBrand}
                                    priceSort={priceSort}
                                    setPriceSort={setPriceSort}
                                    clearAllFilters={clearAllFilters}
                                    hasActiveFilters={hasActiveFilters}
                                />
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        {/* Grid */}
                        {loading ? (
                            <SkeletonGrid count={8} />
                        ) : filteredProducts.length === 0 ? (
                            <EmptySearch query={query} />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredProducts.map((product) => (
                                    <ProductCard key={product._id} product={product} searchQuery={query} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

/* ── Filter Sidebar Component ── */
function FilterSidebar({
    allCategories, selectedCategories, toggleCategory,
    allBrands, selectedBrands, toggleBrand,
    priceSort, setPriceSort, clearAllFilters, hasActiveFilters,
}) {
    const [catOpen, setCatOpen] = useState(true);
    const [brandOpen, setBrandOpen] = useState(true);
    const [priceOpen, setPriceOpen] = useState(true);

    return (
        <div className="flex flex-col gap-5">
            {hasActiveFilters && (
                <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1.5 text-sm text-rose-500 font-semibold hover:text-rose-600 transition-colors"
                >
                    <X size={14} /> Clear all filters
                </button>
            )}

            {/* Category Filter */}
            {allCategories.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button
                        onClick={() => setCatOpen(!catOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50 transition-colors"
                    >
                        <span className="flex items-center gap-2"><Tag size={14} className="text-indigo-500" /> Category</span>
                        <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 ${catOpen ? "rotate-180" : ""}`} />
                    </button>
                    {catOpen && (
                        <div className="px-4 pb-4 flex flex-col gap-2">
                            {allCategories.map((cat) => (
                                <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={selectedCategories.includes(cat)}
                                        onChange={() => toggleCategory(cat)}
                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 accent-indigo-600"
                                    />
                                    <span className={`text-sm font-medium transition-colors ${selectedCategories.includes(cat) ? "text-indigo-700" : "text-gray-600 group-hover:text-gray-900"}`}>
                                        {cat}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Brand Filter */}
            {allBrands.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button
                        onClick={() => setBrandOpen(!brandOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50 transition-colors"
                    >
                        <span className="flex items-center gap-2"><Package size={14} className="text-purple-500" /> Brand</span>
                        <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 ${brandOpen ? "rotate-180" : ""}`} />
                    </button>
                    {brandOpen && (
                        <div className="px-4 pb-4 flex flex-col gap-2">
                            {allBrands.map((brand) => (
                                <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={selectedBrands.includes(brand)}
                                        onChange={() => toggleBrand(brand)}
                                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 accent-indigo-600"
                                    />
                                    <span className={`text-sm font-medium transition-colors ${selectedBrands.includes(brand) ? "text-indigo-700" : "text-gray-600 group-hover:text-gray-900"}`}>
                                        {brand}
                                    </span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Price Sort */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                    onClick={() => setPriceOpen(!priceOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50 transition-colors"
                >
                    <span>Sort by Price</span>
                    <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 ${priceOpen ? "rotate-180" : ""}`} />
                </button>
                {priceOpen && (
                    <div className="px-4 pb-4 flex flex-col gap-2">
                        {[
                            { value: "", label: "Relevance (default)" },
                            { value: "asc", label: "Price: Low → High" },
                            { value: "desc", label: "Price: High → Low" },
                        ].map((opt) => (
                            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                                <input
                                    type="radio"
                                    name="price-sort"
                                    value={opt.value}
                                    checked={priceSort === opt.value}
                                    onChange={() => setPriceSort(opt.value)}
                                    className="w-4 h-4 accent-indigo-600"
                                />
                                <span className={`text-sm font-medium transition-colors ${priceSort === opt.value ? "text-indigo-700" : "text-gray-600 group-hover:text-gray-900"}`}>
                                    {opt.label}
                                </span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Empty State ── */
function EmptySearch({ query }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-6 shadow-sm">
                <Search className="w-12 h-12 text-indigo-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-sora font-extrabold text-gray-800 mb-2">
                No results for &ldquo;{query}&rdquo;
            </h2>
            <p className="text-gray-500 max-w-sm mb-8">
                We couldn&apos;t find any products matching your search. Try different keywords or browse our categories.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
                <Link
                    to="/products"
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg hover:scale-[1.03] transition-all duration-200"
                >
                    Browse All Products
                </Link>
                <Link
                    to="/"
                    className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm shadow-sm hover:bg-gray-50 transition-colors"
                >
                    Go Home
                </Link>
            </div>
        </div>
    );
}
