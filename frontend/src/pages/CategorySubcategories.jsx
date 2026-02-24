import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { fetchSubcategories } from "../features/settings/settingsSlice";
import ProductListingForm from "../components/ProductListingForm";
import { API_BASE_URL } from "../api/baseUrl";

export default function CategorySubcategories() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { subcategories, loading } = useSelector((s) => s.settings);
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (id) dispatch(fetchSubcategories(id));
  }, [id, dispatch]);

  // ── Category detection helpers ──────────────────────────────────────────────
  const BOOK_KEYWORDS = ["book", "books", "novel", "comics", "magazine", "textbook", "encyclopedia"];
  function isBookCategory(category) {
    const name = (category?.category_name || category?.name || "").toLowerCase();
    const slug = (category?.slug || "").toLowerCase();
    return BOOK_KEYWORDS.some(k => name.includes(k)) || slug.includes("/books/") || slug.includes("/book/");
  }

  const ANTIQUE_JEWELRY_KEYWORDS = ["antique", "jewelry", "jewellery", "vintage", "gold", "silver", "thrift", "necklace", "ring", "earring", "bracelet", "pendan", "brooch", "bangle", "trinket", "locket", "charm"];
  function isAntiqueJewelryCategory(category) {
    const name = (category?.category_name || category?.name || "").toLowerCase();
    return ANTIQUE_JEWELRY_KEYWORDS.some(k => name.includes(k));
  }

  const POTTERY_KEYWORDS = ["pottery", "ceramic", "clay", "terracotta", "stoneware", "porcelain", "mugs", "vases", "crockery", "sculpture", "tile", "cup", "vase", "jar", "mug", "plates", "bowls"];
  function isPotteryCategory(category) {
    const name = (category?.category_name || category?.name || "").toLowerCase();
    return POTTERY_KEYWORDS.some(k => name.includes(k));
  }

  const HOME_DECOR_KEYWORDS = ["home decor", "homedecor", "wall art", "clock", "frames", "resin", "mirror"];
  function isHomeDecorCategory(category) {
    const name = (category?.category_name || category?.name || "").toLowerCase();
    return HOME_DECOR_KEYWORDS.some(k => name.includes(k));
  }

  const FLOWERS_HANDCRAFTS_KEYWORDS = ["flowers", "flower", "bouquet", "handcrafts", "mala", "artificial"];
  function isFlowersHandcraftsCategory(category) {
    const name = (category?.category_name || category?.name || "").toLowerCase();
    return FLOWERS_HANDCRAFTS_KEYWORDS.some(k => name.includes(k));
  }

  const normalizeImage = (img) => {
    if (!img) return "https://via.placeholder.com/120x120?text=No+Image";
    if (img.startsWith("http") || img.startsWith("data:")) return img;

    const cleanPath = img.startsWith("/") ? img.slice(1) : img;
    if (cleanPath.startsWith("uploads/")) return `${API_BASE_URL}/${cleanPath}`;
    return `${API_BASE_URL}/uploads/${cleanPath}`;
  };

  const handleCategoryClick = (category) => {
    const children = subcategories.filter(sub => sub.parent_id === category._id || sub.parent_id === category.id);
    const categoryId = category._id || category.id;

    if (children.length > 0) {
      navigate(`/category/${categoryId}`);
    } else if (isPotteryCategory(category)) {
      navigate(`/pottery-listing-form/${categoryId}`);
    } else if (isBookCategory(category)) {
      navigate(`/book-listing-form/${categoryId}`);
    } else if (isAntiqueJewelryCategory(category)) {
      navigate(`/antique-jewelry-listing-form/${categoryId}`);
    } else if (isHomeDecorCategory(category)) {
      navigate(`/home-decor-listing-form/${categoryId}`);
    } else if (isFlowersHandcraftsCategory(category)) {
      navigate(`/flowers-handcrafts-listing-form/${categoryId}`);
    } else {
      setSelectedCategory(category);
      setShowProductForm(true);
    }
  };

  // ── When showing the product form ───────────────────────────────────────────
  if (showProductForm && selectedCategory) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] font-inter">
        <Navbar />
        {/* Ambient glows */}
        <div className="fixed top-20 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-[128px] pointer-events-none z-0" />
        <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-purple-900/15 rounded-full blur-[128px] pointer-events-none z-0" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ProductListingForm
            category={selectedCategory}
            onBack={() => setShowProductForm(false)}
          />
        </div>
        <Footer />
      </div>
    );
  }

  // ── Subcategory picker ──────────────────────────────────────────────────────
  const childrenOnly = (subcategories || []).filter((sub) => sub.parent_id === id);

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-inter">
      <Navbar />

      {/* Ambient glows */}
      <div className="fixed top-20 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-purple-900/15 rounded-full blur-[128px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-sora text-4xl font-extrabold">
              <span className="text-white">What do you want to </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">Sell?</span>
            </h1>
            <p className="mt-2 text-gray-400">Choose a subcategory to continue</p>
          </div>
          <Link
            to="/sell"
            className="text-sm text-gray-400 hover:text-white border border-white/15 hover:border-white/30 px-4 py-2 rounded-xl transition-all duration-200"
          >
            ← Back to Categories
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4" />
            <p className="text-gray-400 font-medium">Loading...</p>
          </div>
        ) : childrenOnly.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {childrenOnly.map((sub) => (
              <div
                key={sub._id || sub.id}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col items-center gap-3 sm:gap-4 cursor-pointer hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300"
                onClick={() => handleCategoryClick(sub)}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden ring-2 ring-white/10 group-hover:ring-indigo-500/30 transition-all duration-300 bg-white/90 flex items-center justify-center">
                  <img
                    src={normalizeImage(sub.image)}
                    alt={sub.category_name}
                    className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = "https://via.placeholder.com/120x120?text=No+Image";
                    }}
                  />
                </div>
                <p className="capitalize font-semibold text-gray-300 group-hover:text-white text-center text-xs sm:text-sm transition-colors duration-200 line-clamp-2">
                  {sub.category_name}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-gray-500 text-lg">No subcategories found.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}