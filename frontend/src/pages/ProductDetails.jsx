import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import "./ProductDetails.css";
import { addToCart } from "../api/cartApi";
import { fetchProfileThunk } from "../features/auth/authSlice";
import ProfileCompletionModal from "../components/ProfileCompletionModal";
import { addToWishlist, removeFromWishlist, checkWishlist } from "../api/wishlistApi";
import toast from 'react-hot-toast';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const BASE_URL = "";

// ✅ Local SVG Fallback (Gray square with "No Image" text)
const DEFAULT_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23999%3Bfont-weight%3Anormal%3Bfont-family%3AHelvetica%2C%20monospace%3Bfont-size%3A14pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%23eee%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2260%22%20y%3D%22105%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E";

// ✅ Normalize backend image paths
const normalizeImage = (img) => {
  if (!img) return DEFAULT_IMAGE;
  if (typeof img !== "string") return DEFAULT_IMAGE;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  if (img.startsWith("data:image")) return img;
  return `${BASE_URL}${img.startsWith("/") ? img : `/${img}`}`;
};


const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth || {}); // Added 'user' to destructuring

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [missingFields, setMissingFields] = useState([]);

  // Fetch profile checks
  useEffect(() => {
    if (token && (!user || !user.email)) {
      dispatch(fetchProfileThunk());
    }
  }, [dispatch, token, user]);

  const validateProfile = () => {
    if (!user) return ["Log in to continue"];

    const missing = [];
    if (!user.phone) missing.push("Mobile Number");
    if (!user.DOB) missing.push("Date of Birth");
    if (!user.gender) missing.push("Gender");
    if (!user.has_delivery_address) missing.push("At least one Delivery Address");
    if (!user.avatar) missing.push("Profile Avatar");

    return missing;
  };

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
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [noStock, setNoStock] = useState(false);

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


  // ... (lines 10-170 omitted)

  // ✅ Add to Cart
  const handleAddToCart = async () => {
    // Check stock
    const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
    if (currentStock <= 0) {
      setNoStock(true);
      setTimeout(() => setNoStock(false), 2000);
      return;
    }

    if (!token) return navigate("/login");
    try {
      setIsAdding(true);
      const pid = product._id || product.id;
      const vid = selectedVariant?.id || null;
      await addToCart(pid, vid, quantity);
      toast.success("Added to cart!");
      setIsAdding(false);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (err) {
      setIsAdding(false);
      toast.error(`Error: ${err.response?.data?.detail || err.message}`);
    }
  };

  // ✅ Buy Now Handler
  const handleBuyNow = async () => {
    // Check stock
    const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
    if (currentStock <= 0) {
      setNoStock(true);
      setTimeout(() => setNoStock(false), 2000);
      return;
    }

    if (!token) {
      navigate("/login");
      return;
    }

    // Check Profile
    const missing = validateProfile();
    // Ignore "Delivery Address" in missing trigger since we fix it in Cart
    const realMissing = missing.filter(m => m !== "At least one Delivery Address");
    if (realMissing.length > 0) {
      setMissingFields(realMissing);
      setShowProfileModal(true);
      return;
    }

    try {
      // Add to Cart first
      setIsAdding(true);
      const pid = product._id || product.id;
      const vid = selectedVariant?.id || null;
      await addToCart(pid, vid, quantity);

      // Redirect to Cart for Address Selection & Checkout
      navigate("/my-cart");
    } catch (err) {
      setIsAdding(false);
      toast.error(`Error: ${err.response?.data?.detail || err.message}`);
    }
  };

  // ✅ Message Seller Handler
  const handleMessageSeller = (sellerId) => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Check Profile
    const missing = validateProfile();
    if (missing.length > 0) {
      setMissingFields(missing);
      setShowProfileModal(true);
      return;
    }

    if (sellerId) {
      navigate(`/chat/${sellerId}`);
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
      toast.error(`Error: ${err.response?.data?.detail || err.message}`);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50 font-sora">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-16 w-16 bg-indigo-500/20 rounded-full mb-4"></div>
          <div className="text-indigo-600 font-medium tracking-wide">Loading Product...</div>
        </div>
      </div>
    );

  if (!product)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-center font-sora">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Product Lost in Space</h2>
        <button
          onClick={() => navigate("/products")}
          className="px-8 py-3 bg-black text-white rounded-full hover:scale-105 transition-transform"
        >
          Return to Marketplace
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
    <>
      <Navbar />
      <div className="min-h-screen bg-[#F8FAFC] font-inter pb-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

            {/* LEFT: STICKY GALLERY (Span 7) */}
            <div className="lg:col-span-7 flex flex-col-reverse lg:flex-row gap-4 h-fit lg:sticky lg:top-24 items-start w-full">

              {/* Thumbnails (Left Side Strip) */}
              {displayedImages.length > 1 && (
                <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto w-full lg:w-24 lg:max-h-[60vh] scrollbar-hide py-2 px-1 flex-shrink-0 order-2 lg:order-1">
                  {displayedImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImage(img)}
                      className={`relative w-20 h-24 lg:w-full lg:h-24 flex-shrink-0 rounded-xl overflow-hidden transition-all duration-300 border border-slate-100 ${mainImage === img
                        ? "ring-2 ring-indigo-600 ring-offset-2 scale-105 shadow-md"
                        : "opacity-60 hover:opacity-100 hover:scale-105"
                        }`}
                    >
                      <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image (Centered & Contained) */}
              <div className="relative group flex-1 w-full max-w-xl mx-auto order-1 lg:order-2">
                {/* Back Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <img
                  src={mainImage}
                  alt={displayName}
                  className="w-full h-auto aspect-[4/5] object-cover rounded-[2rem] shadow-xl shadow-indigo-100/50 transition-transform duration-500 group-hover:scale-[1.01] border border-white/50"
                  onError={(e) => (e.target.src = DEFAULT_IMAGE)}
                />

                {/* Wishlist Button */}
                {token && (
                  <button
                    onClick={handleWishlistToggle}
                    className="absolute top-4 right-4 p-2.5 rounded-full bg-white/80 backdrop-blur-md text-slate-400 hover:text-rose-500 hover:bg-white shadow-md transition-all duration-300 hover:scale-110 z-20 group-hover:opacity-100"
                    title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-6 w-6 ${isInWishlist ? "fill-rose-500 text-rose-500" : "fill-transparent stroke-current"}`}
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT: SCROLLABLE INFO (Span 5) */}
            <div className="lg:col-span-5 space-y-8 lg:pl-4">

              {/* Header Info */}
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold tracking-widest uppercase mb-3">
                  {product.category_name || "Exclusive Drop"}
                </span>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-sora font-extrabold text-slate-900 leading-[1.2] tracking-tight mb-4">
                  {displayName}
                </h1>
                <div className="flex flex-wrap items-baseline gap-4">
                  <span className="text-3xl md:text-4xl font-sora font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                    ₹{displayPrice.toLocaleString()}
                  </span>
                  <span className="text-slate-400 font-medium text-base">
                    Stock: <span className={displayStock > 0 ? "text-emerald-600" : "text-rose-500"}>{displayStock}</span>
                  </span>
                </div>
              </div>

              <div className="h-px bg-slate-200"></div>

              {/* Description */}
              <div className="prose prose-sm sm:prose-base prose-slate max-w-none text-slate-600 leading-relaxed font-medium">
                <p>{displayDesc}</p>
              </div>

              {/* Variants */}
              {variants?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-sora font-bold text-slate-900 text-lg">Select Option</h4>
                  <div className="flex flex-wrap gap-3">
                    {variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      const out = v.stock <= 0;
                      return (
                        <button
                          key={v.id}
                          onClick={() => !out && setSelectedVariant(v)}
                          disabled={out}
                          className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 border-2 ${isSelected
                            ? "border-black bg-black text-white shadow-lg scale-105"
                            : out
                              ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed decoration-slice"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900 hover:scale-105"
                            }`}
                        >
                          {v.sku}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product Attributes */}
              {selectedAttrs.length > 0 && (
                <div className="bg-white/60 border border-slate-200 rounded-2xl p-6 backdrop-blur-md">
                  <h3 className="font-sora font-bold text-slate-900 mb-4 text-base">Key Specifications</h3>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                    {selectedAttrs.map((attr, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">{attr.attribute_name}</span>
                        <span className="text-slate-800 font-semibold text-sm sm:text-base">{attr.value_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex flex-col gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding || isAdded || noStock}
                    className={`col-span-1 px-6 py-4 rounded-2xl border-2 font-bold font-sora text-lg transition-all duration-300 flex items-center justify-center gap-2 ${isAdded
                      ? "bg-emerald-500 border-emerald-500 text-white scale-105"
                      : noStock
                        ? "bg-rose-600 border-rose-600 text-white shake" // Added shake animation class if desired, or just color
                        : "border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white"
                      }`}
                  >
                    {isAdding ? (
                      <span className="animate-spin text-2xl">⏳</span>
                    ) : isAdded ? (
                      <>
                        <span className="text-xl">✓</span> Added
                      </>
                    ) : noStock ? (
                      "Out of Stock"
                    ) : (
                      "Add to Cart"
                    )}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="col-span-1 px-6 py-4 rounded-2xl bg-indigo-600 text-white font-bold font-sora text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-300 transition-all transform hover:-translate-y-1"
                  >
                    Buy Now
                  </button>
                </div>
                <button
                  onClick={() => {
                    const sid = vendor?._id || vendor?.id || product?.vendor_id;
                    handleMessageSeller(sid);
                  }}
                  className="w-full py-3 text-slate-500 font-medium hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 text-base group"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">💬</span> Ask a question about this item
                </button>
              </div>

              {/* SELLER CARD */}
              {vendor && (
                <div className="mt-4 relative overflow-hidden bg-white rounded-[2rem] border border-slate-100 shadow-xl p-6 group hover:shadow-indigo-100 transition-shadow">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-indigo-100 transition-colors"></div>

                  <div className="relative flex items-center gap-5">
                    <div className="relative">
                      <img
                        src={normalizeImage(vendor.image || vendor.profile_image)}
                        alt={vendor.shop_name || "Seller"}
                        className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-md cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => {
                          const sid = vendor._id || vendor.id || vendor.user_id;
                          if (sid) navigate(`/seller/${sid}`);
                        }}
                      />
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-bold font-sora text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors"
                        onClick={() => {
                          const sid = vendor._id || vendor.id || vendor.user_id;
                          if (sid) navigate(`/seller/${sid}`);
                        }}
                      >
                        {vendor.shop_name || "Seller Shop"}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">{vendor.shop_description || "Verified Top Seller"}</p>
                      <div className="flex gap-4 mt-2 text-xs text-slate-400 font-medium">
                        {vendor.address && <span>📍 {vendor.address}</span>}
                        <span className="text-amber-500">★★★★★ 4.9</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const sid = vendor._id || vendor.id || vendor.user_id;
                        if (sid) navigate(`/seller/${sid}`);
                      }}
                      className="px-5 py-2.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                    >
                      Visit Shop
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        missingFields={missingFields}
      />
      <Footer />
    </>
  );
};

export default ProductDetails;
