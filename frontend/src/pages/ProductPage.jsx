// ✅ ProductPage.jsx (For Category-wise listing)
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import CategoryNavbar from "../components/CategoryNavbar";
import Footer from "../components/Footer";
import IconBar from "../components/IconBar";
import ProductCard from "../components/ProductCard";
import { Package } from "lucide-react";
import { API_BASE_URL } from "../api/baseUrl";

export default function ProductPage() {
  const params = useParams();
  const slug = params["*"]; // ✅ full nested category slug
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/Product/Category?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) {
          console.error("Failed fetching products for slug:", slug);
          setProducts([]);
          return;
        }
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [slug]);

  // Capitalise each word of the last slug segment
  const rawTitle = slug ? slug.split("/").pop().replace(/-/g, " ") : "Category";
  const title = rawTitle.replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <CategoryNavbar />

      {/* ── Subcategory icon strip ── */}
      <IconBar parentSlug={slug} />

      {/* ── Hero banner ── */}
      <div className="relative w-full overflow-hidden bg-gradient-to-r from-[#0a0a0a] via-[#0f0a1e] to-[#0a0a0a] py-5 px-4">
        {/* Ambient glows */}
        <div className="absolute top-0 left-1/3 w-64 h-24 bg-indigo-700/30 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-0 right-1/3 w-64 h-24 bg-purple-700/25 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-[1400px] mx-auto flex items-center gap-6">
          {/* Left: breadcrumb + title */}
          <div className="flex-1">
            <p className="text-indigo-400 text-xs font-bold tracking-[0.2em] uppercase mb-1">
              {slug ? slug.split("/").join(" › ") : "Category"}
            </p>
            <h1 className="font-sora text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              <span className="text-white">{title.split(" ")[0]}</span>
              {title.split(" ").length > 1 && (
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-400">
                  {" "}{title.split(" ").slice(1).join(" ")}
                </span>
              )}
            </h1>
          </div>


        </div>
      </div>

      {/* ── Product grid ── */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4" />
            <p className="text-gray-400 font-medium">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-400">No products found for this category.</h2>
            <p className="text-gray-400 mt-2">Check back later for new arrivals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
