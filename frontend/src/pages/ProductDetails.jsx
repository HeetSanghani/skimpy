import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProductDetails.css";

const BASE_URL = "http://localhost:8000";

// ✅ Normalize backend image paths
const normalizeImage = (img) => {
  if (!img) return null;
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  return `${BASE_URL}${img.startsWith("/") ? img : `/${img}`}`;
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [displayedImages, setDisplayedImages] = useState([]);
  const [mainImage, setMainImage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const productRes = await axios.get(`${BASE_URL}/Product/${id}`);
        const data = productRes.data;
        if (!mounted) return;

        console.debug("🧩 Product API response:", data);
        setProduct(data);

        // ✅ If product has vendor_id, fetch vendor (shop) details
        if (data?.vendor_id) {
          try {
            const vendorRes = await axios.get(`${BASE_URL}/Vendor`, {
              params: { vendor_id: data.vendor_id },
            });
            if (mounted) setVendor(vendorRes.data);
          } catch (e) {
            console.warn("⚠️ Could not fetch vendor info", e);
          }
        } else {
          setVendor(null);
        }

        // ✅ Fetch variants
        const variantRes = await axios.get(`${BASE_URL}/Variant/list/${id}`);
        const fetchedVariants = variantRes.data?.variants || [];
        if (!mounted) return;

        console.debug("🎨 Variant API response:", fetchedVariants);
        setVariants(fetchedVariants);
        
        // 🎯 NEW: Select the first variant on load
        const initialVariant = fetchedVariants.length > 0 ? fetchedVariants[0] : null;
        if (initialVariant) {
            setSelectedVariant(initialVariant);
        }

        // ✅ Handle images based on product or initial variant
        const initialImages = 
            initialVariant && Array.isArray(initialVariant.images) && initialVariant.images.length > 0
            ? initialVariant.images.map(normalizeImage)
            : Array.isArray(data.images) && data.images.length > 0
            ? data.images.map(normalizeImage)
            : data.image
            ? [normalizeImage(data.image)]
            : [];

        const safeImages =
          initialImages.length > 0
            ? initialImages
            : ["https://via.placeholder.com/600x600?text=No+Image"];

        setDisplayedImages(safeImages);
        setMainImage(safeImages[0]);
        
      } catch (err) {
        console.error("❌ Error fetching product/variants:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProductData();
    return () => {
      mounted = false;
    };
  }, [id]);

  // 🔄 AUTO-ROTATION EFFECT
  useEffect(() => {
    if (displayedImages.length > 1) {
      const interval = setInterval(() => {
        setMainImage(currentMainImage => {
          const currentIndex = displayedImages.indexOf(currentMainImage);
          const nextIndex = (currentIndex + 1) % displayedImages.length;
          return displayedImages[nextIndex];
        });
      }, 4000); // 4000ms = 4 seconds (slow rotation)

      return () => clearInterval(interval);
    }
  }, [displayedImages]);


  // ✅ Handle variant switching
  const handleVariantClick = (variant) => {
    setSelectedVariant(variant);
    const variantImages =
      Array.isArray(variant.images) && variant.images.length > 0
        ? variant.images.map(normalizeImage)
        : Array.isArray(product?.images) && product.images.length > 0
        ? product.images.map(normalizeImage)
        : product?.image
        ? [normalizeImage(product.image)]
        : [];

    const finalImages =
      variantImages.length > 0
        ? variantImages
        : ["https://via.placeholder.com/600x600?text=No+Image"];

    console.debug("🖼 Switching to variant images:", finalImages);
    setDisplayedImages(finalImages);
    setMainImage(finalImages[0]);
  };

  const handleThumbnailClick = (url) => setMainImage(url);

  const handleAddToCart = () => {
    alert(
      `Added ${product?.product_name || product?.name || "Product"} ${
        selectedVariant ? `(${selectedVariant.sku})` : ""
      } to cart`
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading product details...
      </div>
    );
  }

  // 🎯 If no product or no variant, show 'not found'
  if (!product || variants.length === 0) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-xl font-semibold text-gray-700">
          Product or variants not found
        </h2>
        <button
          onClick={() => navigate("/products")}
          className="mt-4 px-5 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Back to Products
        </button>
      </div>
    );
  }

  // 🎯 NEW: ALWAYS base display data on the selected variant
  const currentDisplay = selectedVariant || variants[0];
  
  const displayPrice = currentDisplay.price;
  const displayStock = currentDisplay.stock;
  const displayName = product.product_name || product.name || "Untitled"; // Keep base product name
  const displayCondition = currentDisplay.condition || product.product_condition || product.condition;
  const displayDescription = currentDisplay.description || product.description || product.desc || "";

  const vendorName = vendor?.shop_name || "";
  const vendorAddress = vendor?.address || "";
  const selectedAttributes = Array.isArray(currentDisplay.attributes)
    ? currentDisplay.attributes
    : [];

  return (
    <div className="max-w-[1800px] mx-auto py-10 px-8">
      <div className="flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-16">
        {/* LEFT COLUMN - Thumbnails */}
        <div className="flex flex-col gap-3 flex-shrink-0">
          {displayedImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => handleThumbnailClick(img)}
              className={`rounded-lg overflow-hidden transition-all ${
                mainImage === img
                  ? "scale-105 ring-2 ring-black shadow-lg"
                  : "hover:ring-1 hover:ring-gray-300"
              }`}
            >
              <img
                src={img}
                alt={`thumb-${idx}`}
                className="w-20 h-20 lg:w-24 lg:h-24 object-cover rounded-md"
              />
            </button>
          ))}
        </div>

        {/* CENTER COLUMN - Main Image (Minimized Width) */}
        <div className="flex-1 max-w-xl relative group"> 
          <div className="main-product-image-container border rounded-2xl overflow-hidden shadow-lg bg-white relative">
            <img
              src={mainImage}
              alt={displayName}
              className="w-full h-full object-cover transition-all duration-300 bg-white"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/600x600?text=No+Image";
              }}
            />

            {/* Arrows (Manual navigation is still useful) */}
            {displayedImages.length > 1 && (
              <>
                <button
                  onClick={() => {
                    const currentIndex = displayedImages.indexOf(mainImage);
                    const newIndex =
                      (currentIndex - 1 + displayedImages.length) %
                      displayedImages.length;
                    setMainImage(displayedImages[newIndex]);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    stroke="black"
                    className="w-6 h-6"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <button
                  onClick={() => {
                    const currentIndex = displayedImages.indexOf(mainImage);
                    const newIndex = (currentIndex + 1) % displayedImages.length;
                    setMainImage(displayedImages[newIndex]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                    stroke="black"
                    className="w-6 h-6"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN - Product Info */}
        <div className="flex-shrink-0 w-full lg:w-auto lg:max-w-md space-y-5">
          <h1 className="text-3xl font-semibold text-gray-900 leading-snug">
            {displayName}
          </h1>

          <div className="flex flex-col mb-3">
            <span className="text-3xl font-bold text-gray-900">
              MRP : ₹ {displayPrice ?? "N/A"}
            </span>
            <span className="text-xs text-gray-500">
              Inclusive of all taxes (also includes all applicable duties)
            </span>
          </div>

          

          {selectedAttributes.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Product Details</h3>
              <div className="space-y-1">
                {selectedAttributes.map((attr, i) => (
                  <p key={i} className="text-sm text-gray-800">
                    <span className="font-medium">{attr.attribute_name}:</span>{" "}
                    {attr.value_name}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm text-gray-700 space-y-1">
            <p>
              <span className="font-semibold">Condition:</span>{" "}
              {displayCondition ?? "N/A"}
            </p>
            <p>
              <span className="font-semibold">Stock:</span>{" "}
              {displayStock ?? "N/A"}
            </p>
          </div>

          <p className="text-gray-700 leading-relaxed">{displayDescription}</p>

          {/* ✅ SHOP INFO */}
          {(vendorName || vendorAddress) && (
            <div className="mt-6 border-t pt-4">
              <h4 className="font-semibold text-gray-800 mb-2">Shop Information</h4>
              <p className="text-gray-900 font-medium">{vendorName}</p>
              <p className="text-gray-600 text-sm">{vendorAddress}</p>
            </div>
          )}

          {/* Variants */}
          {variants?.length > 0 && (
            <div className="mt-8">
                <h4 className="font-semibold text-gray-800 mb-2">Select Option:</h4>
              <div className="sku-grid">
                {variants.map((variant) => {
                  // 🎯 Use selectedVariant?.id for comparison
                  const isSelected = selectedVariant?.id === variant.id; 
                  const isOut = typeof variant.stock === "number" && variant.stock <= 0;

                  return (
                    <button
                      type="button"
                      key={variant.id}
                      disabled={isOut}
                      onClick={() => !isOut && handleVariantClick(variant)}
                      className={`sku-option ${isSelected ? "sku-option--selected" : ""} ${
                        isOut ? "sku-option--disabled" : ""
                      }`}
                      title={isOut ? "Out of stock" : variant.sku}
                    >
                      {variant.sku}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-4 mt-8">
            {/* Buy Now Button */}
            <button
              onClick={() => navigate("/checkout")}
              className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition"
            >
              Buy Now
            </button>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="border border-gray-300 text-black px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition"
            >
              Add to Cart
            </button>

            {/* Message Seller Button */}
            {vendor && (
              <button
                onClick={() =>
                  navigate(
                    `/messages?vendor_user_id=${encodeURIComponent(
                      vendor?.user_id || vendor?.id || ""
                    )}&product_id=${product?.id || product?._id || id}`
                  )
                }
                className="border border-gray-300 text-black px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition"
              >
                Message Seller
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductDetails;