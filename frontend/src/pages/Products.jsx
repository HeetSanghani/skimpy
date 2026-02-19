// ✅ Products.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CategoryNavbar from "../components/CategoryNavbar";
import ProductCard from "../components/ProductCard";
import { fetchAllProducts } from "../api/settingsApi";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const loadProducts = async () => {
      const res = await fetchAllProducts();
      setProducts(res);
    };
    loadProducts();
  }, []);

  const searchTerm = useMemo(() => {
    return (searchParams.get("search") || "").trim().toLowerCase();
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const words = searchTerm.split(/\s+/).filter((w) => !!w);
    if (words.length === 0) return products;
    return products.filter((product) => {
      const fields = [
        product?.product_name,
        product?.description,
        product?.brand,
        product?.category_name,
      ];
      return words.every((word) =>
        fields.some(
          (field) =>
            typeof field === "string" && field.toLowerCase().includes(word)
        )
      );
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
            <span className="text-gray-900">All </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600">Products</span>
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-2xl">
            Explore our complete collection of thrifted finds and handcrafted treasures.
          </p>
        </div>

        {/* Grid */}
        <div className="w-full">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-400">No products found</h2>
              <p className="text-gray-400 mt-2">
                {products.length === 0
                  ? "We are stocking up! Check back soon."
                  : "Try adjusting your search terms."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
