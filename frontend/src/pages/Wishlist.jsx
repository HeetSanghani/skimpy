// ✅ Wishlist.jsx (Final Updated Version with correct Move/Add logic)

import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Products.css";

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
            <div className="grid-container">
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




/* -------------------------
      WISHLIST CARD
   ------------------------- */
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
      alert("Failed to remove item");
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
      alert("Moved to cart ✓");
    } catch (err) {
      console.error(err);
      alert("Could not move to cart");
    }
  };

  /* ---- ADD (Add only, DO NOT Remove) ---- */
  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!token) return navigate("/login");

    const variantId = variant?._id || null;

    try {
      await addToCart(product._id, variantId, 1);
      alert("Added to cart ✓");
    } catch (err) {
      console.error(err);
      alert("Could not add to cart");
    }
  };

  return (
    <div
      className="single-card"
      style={{ transition: "transform 0.2s ease, box-shadow 0.2s ease" }}
    >
      <Link to={`/product/${product._id}`}>
        <div
          className="image-container"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => {
            setHover(false);
            setIdx(0);
          }}
          style={{ overflow: "hidden", borderRadius: 8 }}
        >
          <img
            src={images[idx]}
            alt={product.product_name}
            style={{
              width: "100%",
              objectFit: "cover",
              maxHeight: 360,
              transition: "opacity 0.45s ease",
              opacity: hover ? 0.95 : 1,
            }}
          />
        </div>
      </Link>

      <div className="content">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3 className="product-name">
            <Link to={`/product/${product._id}`} style={{ color: "inherit" }}>
              {product.product_name || "Unnamed Product"}
            </Link>
          </h3>

          {/* DELETE BUTTON */}
          <button
            onClick={handleRemove}
            title="Remove from wishlist"
            style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "0.2s",
            }}
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M3 6h18" strokeLinecap="round" />
              <path
                d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"
                strokeLinecap="round"
              />
              <path d="M10 11v6" strokeLinecap="round" />
              <path d="M14 11v6" strokeLinecap="round" />
              <path
                d="M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14"
                strokeLinecap="round"
              />
            </svg>
          </button>

        </div>

        {/* VARIANT DETAILS */}
        {variant?.size || variant?.color || variant?.material ? (
          <p style={{ color: "#6b7280", fontSize: 13 }}>
            {variant.size && `Size: ${variant.size}`}
            {variant.color && ` | Color: ${variant.color}`}
            {variant.material && ` | Material: ${variant.material}`}
          </p>
        ) : null}

        <p className="product-price" style={{ marginTop: 10 }}>
          ₹ {formatPrice(price)}
        </p>

        <div className="actions" style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {/* MOVE TO CART */}
          <button
            onClick={handleMoveToCart}
            style={{
              padding: "10px 12px",
              background: "#111827",
              color: "white",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
            }}
          >
            Move to Cart
          </button>

          {/* ADD (DO NOT REMOVE FROM WISHLIST) */}
          <button
            onClick={handleAddToCart}
            style={{
              padding: "10px 12px",
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
