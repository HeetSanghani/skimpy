// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useSelector } from "react-redux";
// import axios from "axios";
// import "./ProductDetails.css";
// import { addToCart } from "../api/cartApi";
// import { addToWishlist, removeFromWishlist, checkWishlist } from "../api/wishlistApi";

// const BASE_URL = "http://localhost:8000";

// // ✅ Normalize backend image paths
// const normalizeImage = (img) => {
//   if (!img) return null;
//   if (img.startsWith("http://") || img.startsWith("https://")) return img;
//   return `${BASE_URL}${img.startsWith("/") ? img : `/${img}`}`;
// };

// const ProductDetails = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { token } = useSelector((state) => state.auth);

//   const [product, setProduct] = useState(null);
//   const [vendor, setVendor] = useState(null);
//   const [variants, setVariants] = useState([]);
//   const [selectedVariant, setSelectedVariant] = useState(null);
//   const [displayedImages, setDisplayedImages] = useState([]);
//   const [mainImage, setMainImage] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [isInWishlist, setIsInWishlist] = useState(false);
//   const [wishlistItemId, setWishlistItemId] = useState(null);

//   useEffect(() => {
//     let mounted = true;
//     const fetchProductData = async () => {
//       try {
//         setLoading(true);
//         const productRes = await axios.get(`${BASE_URL}/Product/${id}`);
//         const data = productRes.data;
//         if (!mounted) return;

//         console.debug("🧩 Product API response:", data);
//         setProduct(data);
//         if (data?.vendor) {
//           setVendor(data.vendor);
//         }

//         // ✅ If product has vendor_id, fetch vendor (shop) details
//         if (!data?.vendor && data?.vendor_id) {
//           try {
//             const vendorRes = await axios.get(`${BASE_URL}/Vendor`, {
//               params: { vendor_id: data.vendor_id },
//             });
//             if (mounted) setVendor(vendorRes.data);
//           } catch (e) {
//             console.warn("⚠️ Could not fetch vendor info", e);
//           }
//         } else {
//           setVendor(null);
//         }

//         // ✅ Fetch variants
//         const variantRes = await axios.get(`${BASE_URL}/Variant/list/${id}`);
//         const fetchedVariants = variantRes.data?.variants || [];
//         if (!mounted) return;

//         console.debug("🎨 Variant API response:", fetchedVariants);
//         setVariants(fetchedVariants);
        
//         // 🎯 NEW: Select the first variant on load
//         const initialVariant = fetchedVariants.length > 0 ? fetchedVariants[0] : null;
//         if (initialVariant) {
//             setSelectedVariant(initialVariant);
//         }

//         // ✅ Handle images based on product or initial variant
//         const initialImages = 
//             initialVariant && Array.isArray(initialVariant.images) && initialVariant.images.length > 0
//             ? initialVariant.images.map(normalizeImage)
//             : Array.isArray(data.images) && data.images.length > 0
//             ? data.images.map(normalizeImage)
//             : data.image
//             ? [normalizeImage(data.image)]
//             : [];

//         const safeImages =
//           initialImages.length > 0
//             ? initialImages
//             : ["https://via.placeholder.com/600x600?text=No+Image"];

//         setDisplayedImages(safeImages);
//         setMainImage(safeImages[0]);
        
//       } catch (err) {
//         console.error("❌ Error fetching product/variants:", err);
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     };

//     fetchProductData();
//     return () => {
//       mounted = false;
//     };
//   }, [id]);

//   // 🔄 AUTO-ROTATION EFFECT
//   useEffect(() => {
//     if (displayedImages.length > 1) {
//       const interval = setInterval(() => {
//         setMainImage(currentMainImage => {
//           const currentIndex = displayedImages.indexOf(currentMainImage);
//           const nextIndex = (currentIndex + 1) % displayedImages.length;
//           return displayedImages[nextIndex];
//         });
//       }, 4000); // 4000ms = 4 seconds (slow rotation)

//       return () => clearInterval(interval);
//     }
//   }, [displayedImages]);


//   // ✅ Handle variant switching
//   const handleVariantClick = (variant) => {
//     setSelectedVariant(variant);
//     const variantImages =
//       Array.isArray(variant.images) && variant.images.length > 0
//         ? variant.images.map(normalizeImage)
//         : Array.isArray(product?.images) && product.images.length > 0
//         ? product.images.map(normalizeImage)
//         : product?.image
//         ? [normalizeImage(product.image)]
//         : [];

//     const finalImages =
//       variantImages.length > 0
//         ? variantImages
//         : ["https://via.placeholder.com/600x600?text=No+Image"];

//     console.debug("🖼 Switching to variant images:", finalImages);
//     setDisplayedImages(finalImages);
//     setMainImage(finalImages[0]);
//   };

//   const handleThumbnailClick = (url) => setMainImage(url);

//   // Check wishlist status
//   useEffect(() => {
//     if (token && product) {
//       const checkWishlistStatus = async () => {
//         try {
//           const productId = product._id || product.id;
//           const variantId = selectedVariant?.id || null;
//           const result = await checkWishlist(productId, variantId);
//           setIsInWishlist(result.in_wishlist || false);
//           setWishlistItemId(result.wishlist_item_id || null);
//         } catch (err) {
//           console.error("Error checking wishlist:", err);
//           // Don't set error state, just log it
//         }
//       };
//       checkWishlistStatus();
//     } else {
//       setIsInWishlist(false);
//       setWishlistItemId(null);
//     }
//   }, [token, product, selectedVariant]);

//   const handleAddToCart = async () => {
//     if (!token) {
//       navigate("/login");
//       return;
//     }

//     if (!product) return;

//     try {
//       const productId = product._id || product.id;
//       const variantId = selectedVariant?.id || null;
      
//       console.log("Adding to cart:", { productId, variantId });
      
//       await addToCart(productId, variantId, 1);
//       alert(
//         `Added ${product?.product_name || product?.name || "Product"} ${
//           selectedVariant ? `(${selectedVariant.sku})` : ""
//         } to cart`
//       );
//     } catch (err) {
//       console.error("Error adding to cart:", err);
//       const errorMessage = err.response?.data?.detail || err.message || "Failed to add item to cart";
//       alert(`Error: ${errorMessage}`);
//     }
//   };

//   const handleWishlistToggle = async () => {
//     if (!token) {
//       navigate("/login");
//       return;
//     }

//     if (!product) return;

//     try {
//       const productId = product._id || product.id;
//       const variantId = selectedVariant?.id || null;

//       console.log("Toggling wishlist:", { productId, variantId, isInWishlist, wishlistItemId });

//       if (isInWishlist && wishlistItemId) {
//         await removeFromWishlist(wishlistItemId);
//         setIsInWishlist(false);
//         setWishlistItemId(null);
//         alert("Removed from wishlist");
//       } else {
//         await addToWishlist(productId, variantId);
//         setIsInWishlist(true);
//         // Check again to get the wishlist_item_id
//         const checkResult = await checkWishlist(productId, variantId);
//         setWishlistItemId(checkResult.wishlist_item_id || null);
//         alert("Added to wishlist");
//       }
//     } catch (err) {
//       console.error("Error toggling wishlist:", err);
//       if (err.response?.status === 400 && err.response?.data?.detail === "Item already in wishlist") {
//         // Item is already in wishlist, just update state
//         setIsInWishlist(true);
//         const productId = product._id || product.id;
//         const variantId = selectedVariant?.id || null;
//         const checkResult = await checkWishlist(productId, variantId);
//         setWishlistItemId(checkResult.wishlist_item_id || null);
//       } else {
//         const errorMessage = err.response?.data?.detail || err.message || "Failed to update wishlist";
//         alert(`Error: ${errorMessage}`);
//       }
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen text-gray-500">
//         Loading product details...
//       </div>
//     );
//   }

//   // 🎯 If no product or no variant, show 'not found'
//   if (!product || variants.length === 0) {
//     return (
//       <div className="text-center mt-10">
//         <h2 className="text-xl font-semibold text-gray-700">
//           Product or variants not found
//         </h2>
//         <button
//           onClick={() => navigate("/products")}
//           className="mt-4 px-5 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
//         >
//           Back to Products
//         </button>
//       </div>
//     );
//   }

//   // 🎯 NEW: ALWAYS base display data on the selected variant
//   const currentDisplay = selectedVariant || variants[0];
  
//   const displayPrice = currentDisplay.price;
//   const displayStock = currentDisplay.stock;
//   const displayName = product.product_name || product.name || "Untitled"; // Keep base product name
//   const displayCondition = currentDisplay.condition || product.product_condition || product.condition;
//   const displayDescription = currentDisplay.description || product.description || product.desc || "";

//   const vendorName = vendor?.shop_name || "";
//   const vendorAddress = vendor?.address || "";
//   const selectedAttributes = Array.isArray(currentDisplay.attributes)
//     ? currentDisplay.attributes
//     : [];

//   return (
//     <div className="w-full py-10 px-8">
//       <div className="flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-16">
//         {/* LEFT COLUMN - Thumbnails */}
//         <div className="flex flex-col gap-3 flex-shrink-0">
//           {displayedImages.map((img, idx) => (
//             <button
//               key={idx}
//               onClick={() => handleThumbnailClick(img)}
//               className={`rounded-lg overflow-hidden transition-all ${
//                 mainImage === img
//                   ? "scale-105 ring-2 ring-black shadow-lg"
//                   : "hover:ring-1 hover:ring-gray-300"
//               }`}
//             >
//               <img
//                 src={img}
//                 alt={`thumb-${idx}`}
//                 className="w-20 h-20 lg:w-24 lg:h-24 object-cover rounded-md"
//               />
//             </button>
//           ))}
//         </div>

//         {/* CENTER COLUMN - Main Image (Minimized Width) */}
//         <div className="flex-1 max-w-xl relative group"> 
//           <div className="main-product-image-container border rounded-2xl overflow-hidden shadow-lg bg-white relative">
//             <img
//               src={mainImage}
//               alt={displayName}
//               className="w-full h-full object-cover transition-all duration-300 bg-white"
//               onError={(e) => {
//                 e.target.onerror = null;
//                 e.target.src = "https://via.placeholder.com/600x600?text=No+Image";
//               }}
//             />

//             {/* Arrows (Manual navigation is still useful) */}
//             {displayedImages.length > 1 && (
//               <>
//                 <button
//                   onClick={() => {
//                     const currentIndex = displayedImages.indexOf(mainImage);
//                     const newIndex =
//                       (currentIndex - 1 + displayedImages.length) %
//                       displayedImages.length;
//                     setMainImage(displayedImages[newIndex]);
//                   }}
//                   className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
//                 >
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     strokeWidth="2.5"
//                     stroke="black"
//                     className="w-6 h-6"
//                   >
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
//                   </svg>
//                 </button>

//                 <button
//                   onClick={() => {
//                     const currentIndex = displayedImages.indexOf(mainImage);
//                     const newIndex = (currentIndex + 1) % displayedImages.length;
//                     setMainImage(displayedImages[newIndex]);
//                   }}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"
//                 >
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     strokeWidth="2.5"
//                     stroke="black"
//                     className="w-6 h-6"
//                   >
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
//                   </svg>
//                 </button>
//               </>
//             )}
//           </div>
//         </div>

//         {/* RIGHT COLUMN - Product Info */}
//         <div className="flex-shrink-0 w-full lg:w-auto lg:max-w-md space-y-5">
//           <h1 className="text-3xl font-semibold text-gray-900 leading-snug">
//             {displayName}
//           </h1>

//         <div>
//           <span className="font-semibold">Description:</span>{" "}
//           <span className="text-gray-700 leading-relaxed">{displayDescription}</span>
//         </div>




//           <div className="flex items-center justify-between mb-3">
//             <div className="flex flex-col">
//               <span className="text-3xl font-bold text-gray-900">
//                 MRP : ₹ {displayPrice ?? "N/A"}
//               </span>
//               <span className="text-xs text-gray-500">
//                 Inclusive of all taxes (also includes all applicable duties)
//               </span>
//             </div>
//             {/* Wishlist Button */}
//             {token && (
//               <button
//                 onClick={handleWishlistToggle}
//                 className="p-3 rounded-full hover:bg-gray-100 transition-colors"
//                 title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   className={`h-6 w-6 ${isInWishlist ? "text-red-500 fill-current" : "text-gray-400"}`}
//                   fill={isInWishlist ? "currentColor" : "none"}
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                   strokeWidth={2}
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
//                   />
//                 </svg>
//               </button>
//             )}
//           </div>

          

//           {selectedAttributes.length > 0 && (
//             <div className="mt-4">
//               <h3 className="font-semibold mb-2">Product Details</h3>
//               <div className="space-y-1">
//                 {selectedAttributes.map((attr, i) => (
//                   <p key={i} className="text-sm text-gray-800">
//                     <span className="font-medium">{attr.attribute_name}:</span>{" "}
//                     {attr.value_name}
//                   </p>
//                 ))}
//               </div>
//             </div>
//           )}

//           <div className="text-sm text-gray-700 space-y-1">
//             <p>
//               <span className="font-semibold">Stock:</span>{" "}
//               {displayStock ?? "N/A"}
//             </p>
//           </div>

          

//           {/* ✅ SHOP INFO */}
//           <div className="mt-6 border-t pt-4">
//             <h4 className="font-semibold text-gray-800 mb-2">Shop Information</h4>
//             <p className="text-sm text-gray-800">
//               <span className="font-semibold">Shop name:</span> {vendorName || "N/A"}
//             </p>
//             <p className="text-sm text-gray-800">
//               <span className="font-semibold">Shop address:</span> {vendorAddress || "N/A"}
//             </p>
//           </div>

//           {/* Variants */}
//           {variants?.length > 0 && (
//             <div className="mt-8">
//                 <h4 className="font-semibold text-gray-800 mb-2">Select Option:</h4>
//               <div className="sku-grid">
//                 {variants.map((variant) => {
//                   // 🎯 Use selectedVariant?.id for comparison
//                   const isSelected = selectedVariant?.id === variant.id; 
//                   const isOut = typeof variant.stock === "number" && variant.stock <= 0;

//                   return (
//                     <button
//                       type="button"
//                       key={variant.id}
//                       disabled={isOut}
//                       onClick={() => !isOut && handleVariantClick(variant)}
//                       className={`sku-option ${isSelected ? "sku-option--selected" : ""} ${
//                         isOut ? "sku-option--disabled" : ""
//                       }`}
//                       title={isOut ? "Out of stock" : variant.sku}
//                     >
//                       {variant.sku}
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           )}

//           {/* Buttons */}
//           <div className="flex flex-col gap-4 mt-8">
//             {/* Buy Now Button */}
//             <button
//               onClick={() => navigate("/checkout")}
//               className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition"
//             >
//               Buy Now
//             </button>

//             {/* Add to Cart Button */}
//             <button
//               onClick={handleAddToCart}
//               className="border border-gray-300 text-black px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition"
//             >
//               Add to Cart
//             </button>

           
//               {/* {(vendor || product?.vendor_id) && (
//                 <button
//                   onClick={() => {
//                     const sellerId =
//                       vendor?.user_id || vendor?.id || product?.vendor_id || "";
//                     if (sellerId) {
//                       navigate(`/chat/${sellerId}`);
//                     } else {
//                       console.error("No seller ID found");
//                     }
//                   }}
//                   className="border border-gray-300 text-black px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition"
//                 >
//                   Message Seller
//                 </button>
//               )} */}


            


//           </div>

//         </div>
//       </div>
      
//     </div>
//   );
// };

// export default ProductDetails;










import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import "./ProductDetails.css";
import { addToCart } from "../api/cartApi";
import { addToWishlist, removeFromWishlist, checkWishlist } from "../api/wishlistApi";

const BASE_URL = "http://localhost:8000";

// Normalize backend image paths
const normalizeImage = (img) => {
  if (!img) return null;
  if (typeof img !== "string") return null;
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

  useEffect(() => {
    let mounted = true;

    const fetchProductData = async () => {
      try {
        setLoading(true);
        const productRes = await axios.get(`${BASE_URL}/Product/${id}`);
        const data = productRes.data;
        if (!mounted) return;

        setProduct(data);

        // If product object already includes vendor object, use it.
        if (data?.vendor) {
          setVendor(data.vendor);
        } else if (data?.vendor_id) {
          // If we have vendor_id, request vendor details from backend
          try {
            const vendorRes = await axios.get(`${BASE_URL}/Vendor`, {
              params: { vendor_id: data.vendor_id },
            });
            if (mounted) setVendor(vendorRes.data);
          } catch (e) {
            console.warn("Could not fetch vendor info", e);
            if (mounted) setVendor(null);
          }
        } else {
          // No vendor info available
          setVendor(null);
        }

        // Fetch variants (if API exists)
        try {
          const variantRes = await axios.get(`${BASE_URL}/Variant/list/${id}`);
          const fetchedVariants = variantRes.data?.variants || [];
          if (!mounted) return;
          setVariants(fetchedVariants);

          // Select first variant by default
          const initialVariant = fetchedVariants.length > 0 ? fetchedVariants[0] : null;
          if (initialVariant && mounted) setSelectedVariant(initialVariant);
        } catch (e) {
          // If variant API fails, continue with no variants
          console.warn("Variant fetch failed", e);
          if (mounted) {
            setVariants([]);
            setSelectedVariant(null);
          }
        }

        // Build initial images (variant images preferred)
        const initialVariantForImages =
          (Array.isArray(data?.variants) && data.variants[0]) || null;

        const initialImages =
          (selectedVariant && Array.isArray(selectedVariant.images) && selectedVariant.images.length > 0
            ? selectedVariant.images.map(normalizeImage)
            : null) ||
          (data && Array.isArray(data.images) && data.images.length > 0
            ? data.images.map(normalizeImage)
            : null) ||
          (data && data.image
            ? [normalizeImage(data.image)]
            : []);

        const safeImages =
          (initialImages && initialImages.length > 0)
            ? initialImages
            : ["https://via.placeholder.com/600x600?text=No+Image"];

        if (mounted) {
          setDisplayedImages(safeImages);
          setMainImage(safeImages[0]);
        }
      } catch (err) {
        console.error("Error fetching product/variants:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProductData();

    return () => {
      mounted = false;
    };
  }, [id]);

  // auto-rotate images slowly
  useEffect(() => {
    if (displayedImages.length <= 1) return;
    const interval = setInterval(() => {
      setMainImage((current) => {
        const idx = displayedImages.indexOf(current);
        const next = (idx + 1) % displayedImages.length;
        return displayedImages[next];
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [displayedImages]);

  // update displayed images when selectedVariant changes
  useEffect(() => {
    if (!selectedVariant && product) return;

    const variantImages =
      selectedVariant && Array.isArray(selectedVariant.images) && selectedVariant.images.length > 0
        ? selectedVariant.images.map(normalizeImage)
        : Array.isArray(product?.images) && product.images.length > 0
        ? product.images.map(normalizeImage)
        : product?.image
        ? [normalizeImage(product.image)]
        : [];

    const finalImages = variantImages.length > 0 ? variantImages : ["https://via.placeholder.com/600x600?text=No+Image"];
    setDisplayedImages(finalImages);
    setMainImage(finalImages[0]);
  }, [selectedVariant, product]);

  // thumbnail click
  const handleThumbnailClick = (url) => setMainImage(url);

  // variant click
  const handleVariantClick = (variant) => {
    setSelectedVariant(variant);
  };

  // wishlist check
  useEffect(() => {
    if (!(token && product)) {
      setIsInWishlist(false);
      setWishlistItemId(null);
      return;
    }
    let mounted = true;
    const check = async () => {
      try {
        const productId = product._id || product.id;
        const variantId = selectedVariant?.id || null;
        const result = await checkWishlist(productId, variantId);
        if (!mounted) return;
        setIsInWishlist(result.in_wishlist || false);
        setWishlistItemId(result.wishlist_item_id || null);
      } catch (e) {
        console.error("Error checking wishlist", e);
      }
    };
    check();
    return () => { mounted = false; };
  }, [token, product, selectedVariant]);

  const handleAddToCart = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!product) return;
    try {
      const productId = product._id || product.id;
      const variantId = selectedVariant?.id || null;
      await addToCart(productId, variantId, 1);
      alert(`Added to cart`);
    } catch (err) {
      console.error("Error adding to cart:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Failed to add item to cart";
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleWishlistToggle = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (!product) return;

    try {
      const productId = product._id || product.id;
      const variantId = selectedVariant?.id || null;

      if (isInWishlist && wishlistItemId) {
        await removeFromWishlist(wishlistItemId);
        setIsInWishlist(false);
        setWishlistItemId(null);
      } else {
        await addToWishlist(productId, variantId);
        setIsInWishlist(true);
        const checkResult = await checkWishlist(productId, variantId);
        setWishlistItemId(checkResult.wishlist_item_id || null);
      }
    } catch (err) {
      console.error("Error toggling wishlist:", err);
      const errorMessage = err.response?.data?.detail || err.message || "Failed to update wishlist";
      alert(`Error: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center mt-10">
        <h2 className="text-xl font-semibold text-gray-700">Product not found</h2>
        <button onClick={() => navigate("/products")} className="mt-4 px-5 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Back to Products</button>
      </div>
    );
  }

  // display values
  const currentDisplay = selectedVariant || variants[0] || {};
  const displayPrice = currentDisplay.price ?? product.price ?? "N/A";
  const displayStock = currentDisplay.stock ?? product.stock ?? "N/A";
  const displayName = product.product_name || product.name || "Untitled";
  const displayDescription = currentDisplay.description || product.description || "";

  const vendorName = vendor?.shop_name || vendor?.name || "";
  const vendorAddress = vendor?.address || "";
  const selectedAttributes = Array.isArray(currentDisplay.attributes) ? currentDisplay.attributes : [];

  return (
    <div className="w-full py-10 px-8">
      <div className="flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-16">
        {/* LEFT COLUMN - Thumbnails */}
        <div className="flex flex-col gap-3 flex-shrink-0">
          {displayedImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => handleThumbnailClick(img)}
              className={`rounded-lg overflow-hidden transition-all ${mainImage === img ? "scale-105 ring-2 ring-black shadow-lg" : "hover:ring-1 hover:ring-gray-300"}`}
            >
              <img src={img} alt={`thumb-${idx}`} className="w-20 h-20 lg:w-24 lg:h-24 object-cover rounded-md" />
            </button>
          ))}
        </div>

        {/* CENTER - Main Image */}
        <div className="flex-1 max-w-xl relative group">
          <div className="main-product-image-container border rounded-2xl overflow-hidden shadow-lg bg-white relative">
            <img src={mainImage} alt={displayName} className="w-full h-full object-cover transition-all duration-300 bg-white" onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/600x600?text=No+Image"; }} />
            {displayedImages.length > 1 && (
              <>
                <button onClick={() => { const currentIndex = displayedImages.indexOf(mainImage); const newIndex = (currentIndex - 1 + displayedImages.length) % displayedImages.length; setMainImage(displayedImages[newIndex]); }} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="black" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={() => { const currentIndex = displayedImages.indexOf(mainImage); const newIndex = (currentIndex + 1) % displayedImages.length; setMainImage(displayedImages[newIndex]); }} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="black" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT - Product Info */}
        <div className="flex-shrink-0 w-full lg:w-auto lg:max-w-md space-y-5">
          <h1 className="text-3xl font-semibold text-gray-900 leading-snug">{displayName}</h1>

          <div>
            <span className="font-semibold">Description:</span>{" "}
            <span className="text-gray-700 leading-relaxed">{displayDescription}</span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-gray-900">MRP : ₹ {displayPrice}</span>
              <span className="text-xs text-gray-500">Inclusive of all taxes (also includes all applicable duties)</span>
            </div>

            {token && (
              <button onClick={handleWishlistToggle} className="p-3 rounded-full hover:bg-gray-100 transition-colors" title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isInWishlist ? "text-red-500 fill-current" : "text-gray-400"}`} fill={isInWishlist ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}
          </div>

          {selectedAttributes.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Product Details</h3>
              <div className="space-y-1">
                {selectedAttributes.map((attr, i) => (
                  <p key={i} className="text-sm text-gray-800"><span className="font-medium">{attr.attribute_name}:</span> {attr.value_name}</p>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm text-gray-700 space-y-1">
            <p><span className="font-semibold">Stock:</span> {displayStock}</p>
          </div>

          {/* SHOP INFO */}
          <div className="mt-6 border-t pt-4">
            <h4 className="font-semibold text-gray-800 mb-2">Shop Information</h4>
            <p className="text-sm text-gray-800"><span className="font-semibold">Shop name:</span> {vendorName || "N/A"}</p>
            <p className="text-sm text-gray-800"><span className="font-semibold">Shop address:</span> {vendorAddress || "N/A"}</p>
          </div>

          {/* Variants */}
          {variants?.length > 0 && (
            <div className="mt-8">
              <h4 className="font-semibold text-gray-800 mb-2">Select Option:</h4>
              <div className="sku-grid">
                {variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const isOut = typeof variant.stock === "number" && variant.stock <= 0;
                  return (
                    <button key={variant.id} type="button" disabled={isOut} onClick={() => !isOut && handleVariantClick(variant)} className={`sku-option ${isSelected ? "sku-option--selected" : ""} ${isOut ? "sku-option--disabled" : ""}`} title={isOut ? "Out of stock" : variant.sku}>
                      {variant.sku}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col gap-4 mt-8">
            <button onClick={() => navigate("/checkout")} className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition">Buy Now</button>
            <button onClick={handleAddToCart} className="border border-gray-300 text-black px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition">Add to Cart</button>
          </div>
        </div>
      </div>

      {/* SELLER DETAILS SECTION (below product) */}
      {vendor && (
        <div className="mt-12 w-full bg-white rounded-2xl shadow-lg border border-gray-200 py-8 px-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Seller Information</h2>

          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Left: profile */}
            <div className="flex items-center gap-5">
              <img
                src={vendor.profile_image || "https://via.placeholder.com/120"}
                alt={vendor.shop_name || "Seller"}
                className="w-24 h-24 rounded-full border-2 border-gray-300 object-cover shadow-md cursor-pointer hover:scale-105 transition-transform"
                onClick={() => {
                  const sellerId = vendor._id || vendor.id || vendor.user_id;
                  if (sellerId) navigate(`/seller/${sellerId}`);
                }}
              />

              <div className="flex flex-col">
                <h3
                  onClick={() => {
                    const sellerId = vendor._id || vendor.id || vendor.user_id;
                    if (sellerId) navigate(`/seller/${sellerId}`);
                  }}
                  className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-700 transition"
                >
                  {vendor.shop_name || "Seller Shop"}
                </h3>

                <p className="text-sm text-gray-600 mt-1 max-w-md">
                  {vendor.description || vendor.shop_description || "No shop description available."}
                </p>

                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                  {vendor.address && <p className="flex items-center gap-1"><span>📍</span>{vendor.address}</p>}
                  {vendor.phone && <p className="flex items-center gap-1"><span>📞</span>{vendor.phone}</p>}
                  {vendor.email && <p className="flex items-center gap-1"><span>✉️</span>{vendor.email}</p>}
                </div>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              <button
                onClick={() => {
                  const sellerId = vendor._id || vendor.id || vendor.user_id || product?.vendor_id;
                  if (sellerId) navigate(`/seller/${sellerId}`);
                }}
                className="px-6 py-2 border border-gray-400 rounded-full text-gray-800 hover:bg-gray-100 transition"
              >
                Visit Shop
              </button>

              <button
                onClick={() => {
                  const sellerId =  vendor._id || vendor.id || product?.vendor_id;
                  if (sellerId) navigate(`/chat/${sellerId}`);
                }}
                className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 transition"
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
