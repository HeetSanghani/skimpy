// ✅ Products.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Products.css";

// ✅ API
import { addToCart } from "../api/cartApi";
import { addToWishlist, removeFromWishlist, checkWishlist } from "../api/wishlistApi";
import { fetchAllProducts } from "../api/settingsApi";

// ✅ Price formatting function
function formatPrice(price) {
  return price?.toLocaleString("en-IN");
}

// ✅ Normalize backend image URL
function normalizeImageUrl(img) {
  if (!img) return null;
  if (img.startsWith("http")) return img;

  return `${import.meta.env.VITE_BASE_URL}/uploads/${img}`;
}

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
    // Split search string into all non-empty words
    const words = searchTerm
      .split(/\s+/)
      .filter((w) => !!w);
    if (words.length === 0) return products;
    return products.filter((product) => {
      const fields = [
        product?.product_name,
        product?.description,
        product?.brand,
        product?.category_name,
      ];
      // All words must be present in at least one field
      return words.every((word) =>
        fields.some(
          (field) =>
            typeof field === "string" &&
            field.toLowerCase().includes(word)
        )
      );
    });
  }, [products, searchTerm]);

  const handleInlineSearch = (event) => {
    const value = event.target.value;
    if (value) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

  return (
    <>
      <Navbar />

      <div className="products-container">
        {filteredProducts.length === 0 ? (
          <p className="no-product-text">
            {products.length === 0
              ? "No products available"
              : "No products match your search. Try a different keyword."}
          </p>
        ) : (
          <div className="grid-container">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

/* ✅ PRODUCT CARD COMPONENT */
function ProductCard({ product }) {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  // ✅ FIX: ALWAYS GET PRICE EVEN IF FIELD NAME CHANGES
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

  const images = useMemo(() => {
    const arr = Array.isArray(product.images) ? product.images : [];
    const urls = arr.map(normalizeImageUrl).filter(Boolean);

    return urls.length > 0
      ? urls
      : ["https://via.placeholder.com/800x800?text=No+Image"];
  }, [product.images]);

  // ✅ Auto-Rotate Images
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

        {/* ✅ PRICE FIX — NOW ALWAYS SHOWS */}
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
