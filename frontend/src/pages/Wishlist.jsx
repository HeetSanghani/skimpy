import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Products.css";
import { addToCart } from "../api/cartApi";
import { getWishlistItems, removeFromWishlist } from "../api/wishlistApi";

function formatPrice(price) {
  return price?.toLocaleString("en-IN");
}

function normalizeImageUrl(img) {
  if (!img) return "https://via.placeholder.com/800x800?text=No+Image";
  if (img.startsWith("http")) return img;
  return `${import.meta.env.VITE_BASE_URL}/${img}`;
}

export default function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const { token } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return navigate("/login");

    const fetchWishlist = async () => {
      const items = await getWishlistItems();
      setWishlistItems(items);
    };

    fetchWishlist();
  }, [token]);

  return (
    <>
      <Navbar />

      {/* ✅ This ensures footer stays at bottom */}
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="flex-grow products-container">
          <h2 className="page-heading">
            <b>My Wishlist:</b>
          </h2>

          {wishlistItems.length === 0 ? (
            <p className="no-product-text">No items in wishlist</p>
          ) : (
            <div className="grid-container">
              {wishlistItems.map((item) => (
                <WishlistCard key={item._id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer stays at the bottom */}
        <Footer />
      </div>
    </>
  );
}

function WishlistCard({ item }) {
  const navigate = useNavigate();
  const product = item.product || {};
  const variant = item.variant || {};
  const { token } = useSelector((state) => state.auth);

  const price =
    variant.price ||
    product.display_price ||
    product.price ||
    product.product_price ||
    0;

  const images = useMemo(() => {
    const variantImgs = Array.isArray(variant.images) ? variant.images : [];
    const productImgs = Array.isArray(product.images) ? product.images : [];
    const final = variantImgs.length > 0 ? variantImgs : productImgs;
    const normalized = final.map(normalizeImageUrl);
    return normalized.length > 0
      ? normalized
      : ["https://via.placeholder.com/800x800?text=No+Image"];
  }, [product, variant]);

  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!hover || images.length <= 1) return;
    const intervalId = setInterval(() => {
      setIdx((prev) => (prev + 1) % images.length);
    }, 1500);
    return () => clearInterval(intervalId);
  }, [hover, images.length]);

  const handleRemove = async (e) => {
    e.preventDefault();
    await removeFromWishlist(item._id);
    window.location.reload();
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!token) return navigate("/login");
    await addToCart(product._id, null, 1);
    alert("Added to cart ✅");
  };

  return (
    <div className="single-card">
      <Link to={`/product/${product._id || product.id}`}>
        <div
          className="image-container"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <img src={images[idx]} alt={product.product_name} />
        </div>
      </Link>

      <div className="content">
        <h3 className="product-name">{product.product_name || "Unnamed Product"}</h3>
        <p className="product-price">₹ {formatPrice(price)}</p>

        <div className="actions">
          <button className="add-cart-btn" onClick={handleAddToCart}>
            Add to cart
          </button>
          <button className="wishlist-btn filled" onClick={handleRemove}>
            ❤️
          </button>
        </div>
      </div>
    </div>
  );
}
