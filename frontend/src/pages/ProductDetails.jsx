import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import "./ProductDetails.css";
import { addToCart } from "../api/cartApi";
import { addToWishlist, removeFromWishlist, checkWishlist } from "../api/wishlistApi";

const BASE_URL = "http://localhost:8000";

// ✅ Normalize backend image paths
const normalizeImage = (img) => {
  if (!img) return "https://via.placeholder.com/200x200?text=No+Image";
  if (typeof img !== "string") return "https://via.placeholder.com/200x200?text=No+Image";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  return `${BASE_URL}${img.startsWith("/") ? img : `/${img}`}`;
};


const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth || {});

  const [product, setProduct] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [displayedImages, setDisplayedImages] = useState([]);
  const [mainImage, setMainImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [wishlistItemId, setWishlistItemId] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // ✅ Fetch product, vendor, and variants
  useEffect(() => {
    let mounted = true;
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${BASE_URL}/Product/${id}`);
        const data = res.data;
        if (!mounted) return;
        setProduct(data);

        // Vendor info
        if (data?.vendor) setVendor(data.vendor);
        else if (data?.vendor_id) {
          try {
            const vendorRes = await axios.get(`${BASE_URL}/Vendor`, { params: { vendor_id: data.vendor_id } });
            if (mounted) setVendor(vendorRes.data);
          } catch {
            if (mounted) setVendor(null);
          }
        }

        // Variants
        try {
          const variantRes = await axios.get(`${BASE_URL}/Variant/list/${id}`);
          const fetchedVariants = variantRes.data?.variants || [];
          if (!mounted) return;
          setVariants(fetchedVariants);
          if (fetchedVariants.length > 0) setSelectedVariant(fetchedVariants[0]);
        } catch {
          setVariants([]);
          setSelectedVariant(null);
        }

        // Initial images
        const initialImages =
          (data.images?.map(normalizeImage)) ||
          (data.image ? [normalizeImage(data.image)] : []);
        const safeImages = initialImages.length ? initialImages : ["https://via.placeholder.com/600x600?text=No+Image"];
        if (mounted) {
          setDisplayedImages(safeImages);
          setMainImage(safeImages[0]);
        }
      } catch (err) {
        console.error("Error loading product:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProductData();
    return () => (mounted = false);
  }, [id]);

  // ✅ Auto-rotate images
  useEffect(() => {
    if (displayedImages.length <= 1) return;
    const interval = setInterval(() => {
      setMainImage((current) => {
        const idx = displayedImages.indexOf(current);
        return displayedImages[(idx + 1) % displayedImages.length];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [displayedImages]);

  // ✅ Update images when variant changes
  useEffect(() => {
    if (!selectedVariant && product) return;
    const imgs =
      selectedVariant?.images?.length
        ? selectedVariant.images.map(normalizeImage)
        : product?.images?.length
        ? product.images.map(normalizeImage)
        : product?.image
        ? [normalizeImage(product.image)]
        : ["https://via.placeholder.com/600x600?text=No+Image"];
    setDisplayedImages(imgs);
    setMainImage(imgs[0]);
  }, [selectedVariant, product]);

  // ✅ Wishlist check
  useEffect(() => {
    if (!(token && product)) {
      setIsInWishlist(false);
      setWishlistItemId(null);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const pid = product._id || product.id;
        const vid = selectedVariant?.id || null;
        const result = await checkWishlist(pid, vid);
        if (mounted) {
          setIsInWishlist(result.in_wishlist || false);
          setWishlistItemId(result.wishlist_item_id || null);
        }
      } catch (e) {
        console.error("Wishlist check error:", e);
      }
    })();
    return () => (mounted = false);
  }, [token, product, selectedVariant]);

  // ✅ Add to Cart
  const handleAddToCart = async () => {
    if (!token) return navigate("/login");
    try {
      const pid = product._id || product.id;
      const vid = selectedVariant?.id || null;
      await addToCart(pid, vid, quantity);
      alert("Added to cart!");
    } catch (err) {
      alert(`Error: ${err.response?.data?.detail || err.message}`);
    }
  };

  // ✅ Stripe Checkout
  const payNow = async () => {
    if (!product) return alert("Product not loaded yet.");
    try {
      const payload = [
        {
          name: product.product_name || product.name,
          price: selectedVariant?.price || product.price,
          quantity,
          image: normalizeImage(
            selectedVariant?.images?.[0] ||
              product.images?.[0] ||
              product.image
          ),
          product_id: product._id || product.id,
          variant_id: selectedVariant?._id || selectedVariant?.id || null,
        },
      ];
      const res = await axios.post(`${BASE_URL}/payment/create-checkout-session`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      window.location.href = res.data.checkout_url;
    } catch (err) {
      console.error("Stripe checkout error:", err);
      alert("Payment failed.");
    }
  };

  // ✅ Wishlist toggle
  const handleWishlistToggle = async () => {
    if (!token) return navigate("/login");
    try {
      const pid = product._id || product.id;
      const vid = selectedVariant?.id || null;
      if (isInWishlist && wishlistItemId) {
        await removeFromWishlist(wishlistItemId);
        setIsInWishlist(false);
      } else {
        await addToWishlist(pid, vid);
        const res = await checkWishlist(pid, vid);
        setIsInWishlist(true);
        setWishlistItemId(res.wishlist_item_id || null);
      }
    } catch (err) {
      alert(`Error: ${err.response?.data?.detail || err.message}`);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading product details...
      </div>
    );

  if (!product)
    return (
      <div className="text-center mt-10">
        <h2 className="text-xl font-semibold text-gray-700">Product not found</h2>
        <button
          onClick={() => navigate("/products")}
          className="mt-4 px-5 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Back to Products
        </button>
      </div>
    );

  const current = selectedVariant || {};
  const displayName = product.product_name || product.name;
  const displayPrice = current.price ?? product.price ?? "N/A";
  const displayStock = current.stock ?? product.stock ?? "N/A";
  const displayDesc = current.description || product.description || "";
  const vendorName = vendor?.shop_name || vendor?.name || "";
  const vendorAddr = vendor?.address || "";
  const selectedAttrs = Array.isArray(current.attributes) ? current.attributes : [];

  return (
    <div className="w-full py-10 px-8">
      <div className="flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-16">
        {/* LEFT THUMBNAILS */}
        <div className="flex flex-col gap-3">
          {displayedImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setMainImage(img)}
              className={`rounded-lg overflow-hidden ${mainImage === img ? "ring-2 ring-black" : "hover:ring"}`}
            >
              <img src={img} alt={`thumb-${i}`} className="w-20 h-20 object-cover rounded-md" />
            </button>
          ))}
        </div>

        {/* CENTER IMAGE */}
        <div className="flex-1 max-w-xl relative group">
          <img
            src={mainImage}
            alt={displayName}
            className="w-full rounded-2xl shadow-lg object-cover"
            onError={(e) => (e.target.src = "https://via.placeholder.com/600x600?text=No+Image")}
          />
        </div>

        {/* RIGHT INFO */}
        <div className="flex-shrink-0 lg:max-w-md space-y-5">
          <h1 className="text-3xl font-semibold">{displayName}</h1>
          <p className="text-gray-700">{displayDesc}</p>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold">₹ {displayPrice}</span>
            {token && (
              <button onClick={handleWishlistToggle} title={isInWishlist ? "Remove" : "Add"}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-6 w-6 ${isInWishlist ? "text-red-500 fill-current" : "text-gray-400"}`}
                  fill={isInWishlist ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 
                    4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 
                    4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            )}
          </div>

          {selectedAttrs.length > 0 && (
            <div>
              <h3 className="font-semibold mb-1">Product Details</h3>
              {selectedAttrs.map((attr, i) => (
                <p key={i} className="text-sm">
                  <strong>{attr.attribute_name}:</strong> {attr.value_name}
                </p>
              ))}
            </div>
          )}

          <p className="text-sm text-gray-700">Stock: {displayStock}</p>

          {/* SHOP INFO */}
          <div className="mt-6 border-t pt-4">
            <h4 className="font-semibold mb-2">Shop Information</h4>
            <p>Shop: {vendorName || "N/A"}</p>
            <p>Address: {vendorAddr || "N/A"}</p>
          </div>

          {/* VARIANTS */}
          {variants?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Select Option:</h4>
              <div className="sku-grid">
                {variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const out = v.stock <= 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => !out && setSelectedVariant(v)}
                      disabled={out}
                      className={`sku-option ${isSelected ? "sku-option--selected" : ""} ${
                        out ? "sku-option--disabled" : ""
                      }`}
                    >
                      {v.sku}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* BUTTONS */}
          <div className="flex flex-col gap-4 mt-8">
            <button onClick={payNow} className="bg-green-600 text-white py-2 rounded-full hover:bg-green-700">
              Pay with Stripe
            </button>
            <button onClick={handleAddToCart} className="border py-2 rounded-full hover:bg-gray-100">
              Add to Cart
            </button>
            <button
              onClick={() => {
                const sid = vendor?._id || vendor?.id || product?.vendor_id;
                if (sid) navigate(`/chat/${sid}`);
              }}
              className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800"
            >
              Message Seller
            </button>
          </div>
        </div>
      </div>

      {/* SELLER DETAILS */}
      {vendor && (
        <div className="mt-12 bg-white border rounded-2xl shadow-lg py-8 px-6">
          <h2 className="text-2xl font-semibold mb-6">Seller Information</h2>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <img
                src={vendor.profile_image || "https://via.placeholder.com/120"}
                alt={vendor.shop_name || "Seller"}
                className="w-24 h-24 rounded-full object-cover border-2 cursor-pointer"
                onClick={() => {
                  const sid = vendor._id || vendor.id || vendor.user_id;
                  if (sid) navigate(`/seller/${sid}`);
                }}
              />
              <div>
                <h3
                  onClick={() => {
                    const sid = vendor._id || vendor.id || vendor.user_id;
                    if (sid) navigate(`/seller/${sid}`);
                  }}
                  className="text-xl font-bold cursor-pointer hover:text-blue-600"
                >
                  {vendor.shop_name || "Seller Shop"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {vendor.description || vendor.shop_description || "No description available."}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                  {vendor.address && <p>📍 {vendor.address}</p>}
                  {vendor.phone && <p>📞 {vendor.phone}</p>}
                  {vendor.email && <p>✉️ {vendor.email}</p>}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  const sid = vendor._id || vendor.id || vendor.user_id;
                  if (sid) navigate(`/seller/${sid}`);
                }}
                className="px-6 py-2 border rounded-full hover:bg-gray-100"
              >
                Visit Shop
              </button>
              <button
                onClick={() => {
                  const sid = vendor._id || vendor.id || product?.vendor_id;
                  if (sid) navigate(`/chat/${sid}`);
                }}
                className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800"
              >
                Message Seller
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
