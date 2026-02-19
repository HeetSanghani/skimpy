// ✅ Wishlist.jsx (Final Updated Version with correct Move/Add logic)

import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Products.css";
import toast from 'react-hot-toast';

import { addToCart } from "../api/cartApi";
import { getWishlistItems, removeFromWishlist } from "../api/wishlistApi";

// Format price properly
function formatPrice(price) {
  if (price == null) return "0";
  return new Intl.NumberFormat("en-IN").format(price);
}

// Normalize image
function normalizeImageUrl(img) {
  if (!img) return "https://via.placeholder.com/800x800?text=No+Image";
  if (img.startsWith("http")) return img;
  return `${import.meta.env.VITE_BASE_URL}/${img}`;
}

// Skeleton loader
function WishlistSkeleton() {
  return (
    <div className="grid-container">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="single-card skeleton">
          <div className="image-container">
            <div className="skeleton-box" style={{ width: "100%", height: 320 }} />
          </div>
          <div className="content">
            <div className="skeleton-box" style={{ width: "60%", height: 20, marginBottom: 8 }} />
            <div className="skeleton-box" style={{ width: "40%", height: 20, marginBottom: 12 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <div className="skeleton-box" style={{ width: 120, height: 40 }} />
              <div className="skeleton-box" style={{ width: 48, height: 40 }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return navigate("/login");

    let mounted = true;

    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const items = await getWishlistItems();
        if (!mounted) return;
        setWishlistItems(items || []);
      } catch (err) {
        console.error("Failed to load wishlist:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchWishlist();
    return () => (mounted = false);
  }, [token, navigate]);

  // Remove locally for smooth UI
  const removeLocal = (id) => {
    setWishlistItems((prev) => prev.filter((x) => x._id !== id));
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* MAIN AREA */}
        <div className="flex-grow products-container">

          {loading ? (
            <WishlistSkeleton />
          ) : wishlistItems.length === 0 ? (
            <EmptyWishlist navigate={navigate} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4 sm:p-6">
              {wishlistItems.map((item) => (
                <WishlistCard
                  key={item._id}
                  item={item}
                  onRemoveLocal={removeLocal}
                />
              ))}
            </div>
          )}

        </div>

        {/* STATIC FOOTER */}
        <Footer />
      </div>
    </>
  );
}

/* -------------------------
      EMPTY WISHLIST VIEW
   ------------------------- */
function EmptyWishlist({ navigate }) {
  return (
    <div className="text-center py-12">
      {/* Icon */}
      <img
        src="https://cdn-icons-png.flaticon.com/512/5735/5735325.png"
        alt="Empty Wishlist"
        className="w-36 mx-auto mb-6 opacity-90"
      />

      {/* Title */}
      <h3 className="text-2xl font-semibold mb-2">Your wishlist is empty</h3>

      {/* Subtitle */}
      <p className="text-gray-600 mb-6">
        Add items you love and they'll appear here.
      </p>

      {/* Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => navigate("/products")}
          className="px-6 py-3 bg-black text-white rounded-md hover:opacity-95 transition"
        >
          Browse Products
        </button>

        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-white border rounded-md hover:bg-gray-50 transition"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}




function WishlistCard({ item, onRemoveLocal }) {
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const product = item.product || {};
  const variant = item.variant || {};

  const price =
    variant.price ||
    product.display_price ||
    product.price ||
    product.product_price ||
    0;

  // Prefer variant images over product images
  const images = useMemo(() => {
    const vImgs = Array.isArray(variant.images) ? variant.images : [];
    const pImgs = Array.isArray(product.images) ? product.images : [];

    const final = vImgs.length > 0 ? vImgs : pImgs;
    return final.length
      ? final.map(normalizeImageUrl)
      : ["https://via.placeholder.com/800x800?text=No+Image"];
  }, [product, variant]);

  // Hover image rotation
  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!hover || images.length <= 1) return;
    const rotation = setInterval(
      () => setIdx((prev) => (prev + 1) % images.length),
      1400
    );
    return () => clearInterval(rotation);
  }, [hover, images.length]);

  /* ---- REMOVE FROM WISHLIST ---- */
  const handleRemove = async (e) => {
    e.preventDefault();
    try {
      await removeFromWishlist(item._id);
      onRemoveLocal(item._id);
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove item");
    }
  };

  /* ---- MOVE TO CART (Add + Remove) ---- */
  const handleMoveToCart = async (e) => {
    e.preventDefault();
    if (!token) return navigate("/login");

    const variantId = variant?._id || null;

    try {
      await addToCart(product._id, variantId, 1);
      await removeFromWishlist(item._id);
      onRemoveLocal(item._id);
      toast.success("Moved to cart ✓");
    } catch (err) {
      console.error(err);
      toast.error("Could not move to cart");
    }
  };

  /* ---- ADD (Add only, DO NOT Remove) ---- */
  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!token) return navigate("/login");

    const variantId = variant?._id || null;

    try {
      await addToCart(product._id, variantId, 1);
      toast.success("Added to cart ✓");
    } catch (err) {
      console.error(err);
      toast.error("Could not add to cart");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full border border-gray-100 relative group">
      <Link to={`/product/${product._id}`} className="block relative aspect-[4/5] overflow-hidden bg-gray-100">
        <div
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => {
            setHover(false);
            setIdx(0);
          }}
          className="w-full h-full"
        >
          <img
            src={images[idx]}
            alt={product.product_name}
            className="w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: hover ? 0.95 : 1 }}
          />
        </div>

        {/* Remove Button - Absolute positioned */}
        <button
          onClick={(e) => { e.preventDefault(); handleRemove(e); }}
          title="Remove from wishlist"
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-full shadow-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">
          <Link to={`/product/${product._id}`} className="hover:text-indigo-600 transition-colors">
            {product.product_name || "Unnamed Product"}
          </Link>
        </h3>

        {/* VARIANT DETAILS */}

        <p className="text-xs text-gray-500 line-clamp-1 h-4">
          {(variant?.size || variant?.color || variant?.material) ? (
            <>
              {variant.size && `Size: ${variant.size}`}
              {variant.color && ` | ${variant.color}`}
              {variant.material && ` | ${variant.material}`}
            </>
          ) : <span>&nbsp;</span>}
        </p>


        <p className="font-bold text-gray-900 mt-2 text-lg">
          ₹ {formatPrice(price)}
        </p>

        <div className="flex gap-2 mt-auto pt-4">
          {/* MOVE TO CART */}
          <button
            onClick={handleMoveToCart}
            className="flex-1 px-3 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            Move to Cart
          </button>

          {/* ADD (DO NOT REMOVE FROM WISHLIST) */}
          <button
            onClick={handleAddToCart}
            className="px-3 py-2 bg-white text-slate-700 border border-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
