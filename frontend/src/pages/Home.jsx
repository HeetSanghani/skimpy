import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import CategoryNavbar from "../components/CategoryNavbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { SkeletonGrid } from "../components/Skeletons";
import { fetchAllCategories, fetchAllProducts } from "../api/settingsApi";
import { useSEO } from "../hooks/useSEO";
import { API_BASE_URL } from "../api/baseUrl";

const normalizeImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  // If path already starts with uploads/, don't prepend it again
  if (cleanPath.startsWith("uploads/")) {
    return `${API_BASE_URL}/${cleanPath}`;
  }

  return `${API_BASE_URL}/uploads/${cleanPath}`;
};

export default function Home() {
  useSEO({
    title: "Skimpy — Thrifted & Handcrafted Marketplace",
    description: "Discover unique thrifted finds, handcrafted treasures, antiques, books, and more on Skimpy — India's curated online marketplace.",
    url: "/",
  });
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isCategoriesLoading, setCategoriesLoading] = useState(true);
  const [isProductsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      try {
        const [categoryData, productData] = await Promise.all([
          fetchAllCategories(),
          fetchAllProducts(),
        ]);

        if (!isActive) return;

        setCategories(categoryData || []);
        // Get random 8 products for "Featured" to keep it fresh
        const allProducts = productData || [];
        const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
        setFeaturedProducts(shuffled.slice(0, 8));
      } catch (err) {
        console.error("Failed to load home page data", err);
        if (isActive) {
          setError(
            "We couldn't load the latest marketplace updates. Please try again shortly."
          );
        }
      } finally {
        if (isActive) {
          setCategoriesLoading(false);
          setProductsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, []);

  const featuredCategories = useMemo(
    () => categories.filter((cat) => !cat.parent_id).slice(0, 4),
    [categories]
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-inter">
      <Navbar />
      <CategoryNavbar />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
        {/* HERO SECTION */}
        <section className="relative w-full rounded-[2rem] overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-2xl shadow-indigo-200 animate-fade-in">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>

          <div className="relative px-6 py-8 md:py-16 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            <div className="max-w-xl text-center md:text-left space-y-6">
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs sm:text-sm font-semibold tracking-wider uppercase border border-white/10 animate-fade-in" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
                New Arrivals
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-sora font-extrabold leading-[1.1] tracking-tight animate-slide-up" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
                Curated styles for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-white">modern era.</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-indigo-100 font-medium leading-relaxed max-w-lg mx-auto md:mx-0 animate-slide-up" style={{ animationDelay: '0.5s', opacity: 0, animationFillMode: 'forwards' }}>
                Discover unique thrifted gems and handmade treasures from our curated community.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link to="/products" className="px-6 py-3 bg-white text-indigo-600 rounded-full font-bold text-sm sm:text-base hover:shadow-2xl hover:scale-105 transition-all duration-300 btn-ripple hover-lift animate-slide-up" style={{ animationDelay: '0.7s', opacity: 0, animationFillMode: 'forwards' }}>
                  Shop Now
                </Link>
                <Link to="/about" className="px-6 py-3 bg-indigo-900/40 text-white rounded-full font-bold text-sm sm:text-base backdrop-blur-sm border border-white/20 hover:bg-indigo-900/60 transition-all duration-300 animate-slide-up" style={{ animationDelay: '0.9s', opacity: 0, animationFillMode: 'forwards' }}>
                  Our Story
                </Link>
              </div>
            </div>

            {/* Featured Category Highlight - Redesigned to be "filled" and futuristic */}
            <div className="hidden md:block relative w-full max-w-sm">
              {/* Back glow */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-white/30 to-purple-500/30 rounded-[30px] blur-xl opacity-70 animate-pulse"></div>

              {/* Main Card */}
              <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-[24px] p-6 shadow-2xl overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                <h3 className="text-2xl font-sora font-bold text-white mb-2">Trending Now</h3>
                <p className="text-white/80 text-sm mb-6 leading-relaxed">
                  Check out the most popular categories this week.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {featuredCategories.slice(0, 4).map((cat) => (
                    <Link
                      key={cat.id || cat._id}
                      to={`/products/${cat.slug}`}
                      className="flex flex-col items-center justify-center bg-black/20 hover:bg-white/20 border border-white/10 hover:border-white/40 p-3 rounded-xl transition-all duration-300 group/item"
                    >
                      <div className="w-10 h-10 mb-2 rounded-full overflow-hidden bg-white/10 p-1 flex items-center justify-center">
                        {normalizeImageUrl(cat.image) ? (
                          <img src={normalizeImageUrl(cat.image)} className="w-full h-full object-contain filter invert" alt={cat.category_name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold">{cat.category_name?.[0]}</div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-white truncate w-full text-center">{cat.category_name}</span>
                    </Link>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <Link to="/products" className="flex items-center justify-between w-full px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/30 rounded-full transition-all duration-300 group/btn">
                    <span className="text-sm font-bold text-white tracking-wide">Explore Marketplace</span>
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 group-hover/btn:bg-white group-hover/btn:text-indigo-600 transition-all duration-300">
                      →
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SHOP BY CATEGORY - FUTURISTIC REDESIGN */}
        <section>
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-4xl font-sora font-extrabold text-gray-900 tracking-tight">
                Shop by <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Category</span>
              </h2>
              <p className="mt-3 text-lg text-gray-500 font-medium">Curated aesthetics for the new age.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {isCategoriesLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200/50 rounded-[2rem] animate-pulse"></div>
              ))
            ) : (
              featuredCategories.map((cat, index) => {
                // Vibrant gradients that "shout"
                const gradients = [
                  "from-orange-400 via-pink-500 to-purple-600",
                  "from-blue-400 via-indigo-500 to-violet-600",
                  "from-emerald-400 via-teal-500 to-cyan-600",
                  "from-rose-400 via-fuchsia-500 to-indigo-600"
                ];
                const gradient = gradients[index % gradients.length];

                return (
                  <Link
                    key={cat._id}
                    to={`/products/${cat.slug}`}
                    className="group relative h-96 w-full overflow-hidden rounded-[2rem] shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover-glow"
                  >
                    {/* Vibrant gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-transform duration-700 group-hover:scale-110`}></div>

                    {/* Noise texture */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay pointer-events-none"></div>

                    {/* Image — scales up on hover */}
                    <div className="absolute inset-0 flex items-center justify-center p-10 transition-transform duration-700 group-hover:scale-110">
                      {normalizeImageUrl(cat.image) ? (
                        <img
                          src={normalizeImageUrl(cat.image)}
                          className="w-full h-full object-contain filter invert drop-shadow-2xl"
                          alt={cat.category_name}
                        />
                      ) : (
                        <span className="text-9xl text-white font-black opacity-40 select-none">
                          {cat.category_name?.[0]}
                        </span>
                      )}
                    </div>

                    {/* Dark gradient overlay — slides up on hover */}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out" />

                    {/* Text content — slides up on hover */}
                    <div className="absolute inset-x-0 bottom-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out">
                      <h3 className="text-2xl font-sora font-extrabold text-white leading-tight tracking-tight drop-shadow-lg mb-2">
                        {cat.category_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-white/90 font-semibold text-sm tracking-widest uppercase">
                          Shop Now
                        </span>
                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/20 text-white text-xs font-bold">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}

            {/* "View All" Card - Synergized */}
            <Link
              to="/products"
              className="group relative h-96 w-full overflow-hidden rounded-[2rem] bg-black flex flex-col items-center justify-center text-center shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            >
              {/* Animated Gradient Bg */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"></div>
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 translate-x-[-100%] group-hover:animate-shine"></div>

              <div className="relative z-10 p-8">
                <div className="w-20 h-20 rounded-full border-2 border-white/20 flex items-center justify-center mx-auto mb-6 group-hover:border-white transition-colors duration-300 group-hover:scale-110">
                  <span className="text-3xl text-white">→</span>
                </div>
                <h3 className="text-3xl font-sora font-bold text-white">View All</h3>
                <p className="text-gray-400 mt-2">Discover 20+ more categories</p>
              </div>
            </Link>
          </div>
        </section>

        {/* FEATURED PRODUCTS */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-4xl font-sora font-extrabold text-gray-900 tracking-tight">
                Newly <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Added</span>
              </h2>
              <p className="mt-3 text-lg text-gray-500 font-medium">Fresh arrivals, just dropped in.</p>
            </div>
            <Link to="/products" className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors">
              View All →
            </Link>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl mb-6">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 stagger-children">
            {isProductsLoading ? (
              <div className="col-span-full"><SkeletonGrid count={8} /></div>
            ) : featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
                No products added yet.
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
