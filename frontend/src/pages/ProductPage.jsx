// ✅ ProductPage.jsx (Updated to match Products.jsx design)

import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import CategoryNavbar from "../components/CategoryNavbar";
import IconBar from "../components/IconBar";
import "./Products.css";

// ✅ API imports
import { addToCart } from "../api/cartApi";
import { addToWishlist, removeFromWishlist, checkWishlist } from "../api/wishlistApi";

// ✅ Price formatting function
function formatPrice(price) {
  return price?.toLocaleString("en-IN");
}

// ✅ Normalize image url
function normalizeImageUrl(img) {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return `${import.meta.env.VITE_BASE_URL}/uploads/${img}`;
}

export default function ProductPage() {
  const params = useParams();
  const slug = params["*"]; // ✅ full nested category slug
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      if (!slug) return;

      try {
        const res = await fetch(
          `http://localhost:8000/Product/Category?slug=${slug}`
        );
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
      }
    };

    fetchProducts();
  }, [slug]);

  const title = slug ? slug.split("/").pop().replace(/-/g, " ") : "Products";

  return (
    <>
      <Navbar />
      <CategoryNavbar />
      <IconBar parentSlug={slug} />

      <div className="products-container">
        <h1 className="page-title">{title}</h1>

        {products.length === 0 ? (
          <p className="no-product-text">No products found.</p>
        ) : (
          <div className="grid-container">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ✅ SAME PRODUCT CARD USED IN Products.jsx */
function ProductCard({ product }) {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  // ✅ universal price fix
  const displayPrice =
    product?.display_price ||
    product?.price ||
    product?.product_price ||
    0;

  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState(null);

  useEffect(() => {
    if (token && product?._id) {
      const check = async () => {
        const result = await checkWishlist(product._id, null);
        setIsInWishlist(result.in_wishlist);
        setWishlistItemId(result.wishlist_item_id);
      };
      check();
    }
  }, [token, product]);

  // ✅ normalize image
  const images = useMemo(() => {
    const arr = Array.isArray(product.images) ? product.images : [];
    const urls = arr.map(normalizeImageUrl).filter(Boolean);
    return urls.length > 0
      ? urls
      : ["https://via.placeholder.com/800x800?text=No+Image"];
  }, [product.images]);

  // ✅ Auto image rotate
  useEffect(() => {
    if (!hover || images.length <= 1) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % images.length);
    }, 1500);
    return () => clearInterval(id);
  }, [hover, images.length]);

  // ✅ Add to cart
  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!token) return navigate("/login");
    await addToCart(product._id, null, 1);
    alert("Added to cart ✅");
  };

  // ✅ Wishlist toggle
  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    if (!token) return navigate("/login");

    if (isInWishlist && wishlistItemId) {
      await removeFromWishlist(wishlistItemId);
      setIsInWishlist(false);
      return;
    }

    await addToWishlist(product._id, null);
    setIsInWishlist(true);
  };

  return (
    <div className="single-card">
      <Link to={`/product/${product._id}`}>
        <div
          className="image-container"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <img src={images[idx]} alt={product.product_name} />
        </div>
      </Link>

      <div className="content">
        <h3 className="product-name">{product.product_name}</h3>

        <p className="product-price">₹ {formatPrice(displayPrice)}</p>

        <div className="actions">
          <button className="add-cart-btn" onClick={handleAddToCart}>
            Add to cart
          </button>

          <button className="wishlist-btn" onClick={handleWishlistToggle}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`heart-icon ${isInWishlist ? "filled" : ""}`}
              viewBox="0 0 24 24"
            >
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
