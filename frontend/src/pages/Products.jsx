// Products.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CategoryNavbar from "../components/CategoryNavbar";
import ProductCard from "../components/ProductCard";
import { SkeletonGrid } from "../components/Skeletons";
import EmptyState from "../components/EmptyState";
import { fetchAllProducts } from "../api/settingsApi";
import { useSEO } from "../hooks/useSEO";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const timerRef = useRef(null);

  const searchTerm = useMemo(() => (searchParams.get("search") || "").trim().toLowerCase(), [searchParams]);

  useSEO({
    title: searchTerm ? `"${searchTerm}" — Search Results` : "Browse Products",
    description: "Explore our complete collection of thrifted finds, handcrafted treasures, antiques and books on Skimpy Marketplace.",
    url: "/products",
  });

  useEffect(() => {
    const loadProducts = async () => {
      // Only show skeleton loader if response takes > 200ms
      timerRef.current = setTimeout(() => setShowSkeleton(true), 200);
      try {
        const res = await fetchAllProducts();
        setProducts(Array.isArray(res) ? res : []);
        setError(null);
      } catch {
        setError("Failed to load products. Please try again.");
      } finally {
        clearTimeout(timerRef.current);
        setShowSkeleton(false);
        setLoading(false);
      }
    };
    loadProducts();
    return () => clearTimeout(timerRef.current);
  }, []);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const words = searchTerm.split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      const fields = [p?.product_name, p?.description, p?.brand, p?.category_name];
      return words.every((w) => fields.some((f) => typeof f === "string" && f.toLowerCase().includes(w)));
    });
  }, [products, searchTerm]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <CategoryNavbar />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-sora font-extrabold tracking-tight mb-4 inline-block">
            {searchTerm ? (
              <>
                <span className="text-gray-900">Results for </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600">
                  &ldquo;{searchTerm}&rdquo;
                </span>
              </>
            ) : (
              <>
                <span className="text-gray-900">All </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600">Products</span>
              </>
            )}
          </h1>
          {!searchTerm && (
            <p className="text-lg text-gray-500 font-medium max-w-2xl">
              Explore our complete collection of thrifted finds and handcrafted treasures.
            </p>
          )}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Product grid */}
        <div className="w-full">
          {loading && showSkeleton ? (
            <SkeletonGrid count={8} />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={searchTerm ? "🔍" : "📦"}
              title={searchTerm ? "No results found" : "No products yet"}
              subtitle={
                searchTerm
                  ? `We couldn't find anything for "${searchTerm}". Try different keywords.`
                  : "We're stocking up! Check back soon."
              }
              cta={searchTerm ? { label: "Clear Search", to: "/products" } : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} loading="lazy" />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
