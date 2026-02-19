import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { fetchCategories } from "../features/settings/settingsSlice";

export default function Sell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categories, loading } = useSelector((state) => state.settings);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const normalizeImage = (img) => {
    if (!img) return "https://via.placeholder.com/100x100?text=No+Image";
    if (img.startsWith("http") || img.startsWith("data:")) return img;
    const cleanPath = img.startsWith("/") ? img.slice(1) : img;
    if (cleanPath.startsWith("uploads/")) return `/${cleanPath}`;
    return `/uploads/${cleanPath}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-inter">
      <Navbar />

      {/* Ambient glows */}
      <div className="fixed top-20 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-purple-900/15 rounded-full blur-[128px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-sora text-4xl md:text-5xl font-extrabold tracking-tight">
            <span className="text-white">Start </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-400">
              Selling
            </span>
          </h1>
          <p className="mt-3 text-gray-400 text-lg">
            Choose a category to list your item
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4" />
            <p className="text-gray-400 font-medium">Loading categories...</p>
          </div>
        ) : categories?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <div
                key={cat._id || cat.id}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col items-center gap-3 sm:gap-4 cursor-pointer hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300"
                onClick={() => navigate(`/category/${cat._id || cat.id}`)}
              >
                {/* Glow on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden ring-2 ring-white/10 group-hover:ring-indigo-500/30 transition-all duration-300 bg-white/90 flex items-center justify-center">
                  <img
                    src={normalizeImage(cat.image)}
                    alt={cat.category_name}
                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <p className="capitalize font-semibold text-gray-300 group-hover:text-white text-center text-xs sm:text-sm transition-colors duration-200 line-clamp-2">
                  {cat.category_name}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-gray-500 text-lg">No categories found.</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
