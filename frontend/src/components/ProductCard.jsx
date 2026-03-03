import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { addToCart } from "../api/cartApi";
import { addToWishlist, removeFromWishlist, checkWishlist } from "../api/wishlistApi";

// Helper for formatting price
const formatPrice = (price) => {
    return price?.toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};

// Helper for normalizing Image URL
const normalizeImageUrl = (img) => {
    if (!img) return null;
    if (img.startsWith("http")) return img;
    return `${import.meta.env.VITE_BASE_URL}/uploads/${img}`;
};

const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const { token } = useSelector((state) => state.auth);

    const displayPrice =
        product?.display_price ||
        product?.price ||
        product?.product_price ||
        0;

    const [idx, setIdx] = useState(0);
    const [hover, setHover] = useState(false);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [wishlistItemId, setWishlistItemId] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const [noStock, setNoStock] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [wishlistAnimating, setWishlistAnimating] = useState(false);

    useEffect(() => {
        if (token && product?._id) {
            const check = async () => {
                try {
                    const result = await checkWishlist(product._id, null);
                    setIsInWishlist(result.in_wishlist);
                    setWishlistItemId(result.wishlist_item_id);
                } catch (error) {
                    console.error("Error checking wishlist", error);
                }
            };
            check();
        }
    }, [token, product]);

    const images = useMemo(() => {
        const arr = Array.isArray(product.images) ? product.images : [];
        const fromObject = product.image ? [product.image] : [];
        const allImages = [...arr, ...fromObject];

        // Convert all to strings/urls
        const urls = allImages.map(img =>
            typeof img === 'string' ? normalizeImageUrl(img) : normalizeImageUrl(img?.url)
        ).filter(Boolean);

        return urls.length > 0
            ? urls
            : ["https://via.placeholder.com/800x1000?text=No+Image"];
    }, [product]);

    // Auto-Rotate Images on Hover
    useEffect(() => {
        if (!hover || images.length <= 1) return;
        const id = setInterval(() => {
            setIdx((i) => (i + 1) % images.length);
        }, 1200);
        return () => clearInterval(id);
    }, [hover, images.length]);

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Check stock
        const currentStock = product?.stock || 0;
        if (currentStock <= 0) {
            setNoStock(true);
            setTimeout(() => setNoStock(false), 2000);
            return;
        }

        if (!token) return navigate("/login");
        try {
            setIsAdding(true);
            await addToCart(product._id, null, 1);
            setIsAdding(false);
            setIsAdded(true);
            setTimeout(() => setIsAdded(false), 2000);
        } catch (error) {
            console.error("Add to cart failed", error);
            setIsAdding(false);
        }
    };

    const handleWishlistToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!token) return navigate("/login");

        try {
            setWishlistAnimating(true);
            if (isInWishlist && wishlistItemId) {
                await removeFromWishlist(wishlistItemId);
                setIsInWishlist(false);
                setWishlistItemId(null);
            } else {
                const res = await addToWishlist(product._id, null);
                setIsInWishlist(true);
                setWishlistItemId(res.wishlist_item_id);
            }
            setTimeout(() => setWishlistAnimating(false), 300);
        } catch (error) {
            console.error("Wishlist toggle failed", error);
            setWishlistAnimating(false);
        }
    };

    return (
        <div
            className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border border-gray-100 hover:border-indigo-100"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {/* Image Container (4:5 Ratio) */}
            <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-100">
                <Link to={`/product/${product._id}`} className="block w-full h-full cursor-pointer">
                    {/* Loading shimmer effect */}
                    {!imageLoaded && (
                        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200"></div>
                    )}

                    <img
                        src={images[idx]}
                        alt={product.product_name}
                        loading="lazy"
                        decoding="async"
                        onLoad={() => setImageLoaded(true)}
                        className={`
                            absolute inset-0 h-full w-full object-cover 
                            transition-all duration-700 ease-out
                            ${hover ? 'scale-110 rotate-1' : 'scale-100 rotate-0'}
                            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                        `}
                    />

                    {/* Hover Overlay with gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>

                {/* Wishlist Button with bounce animation */}
                <button
                    onClick={handleWishlistToggle}
                    className={`
                        absolute top-3 right-3 p-2.5 rounded-full 
                        bg-white/90 backdrop-blur-sm shadow-lg
                        text-gray-400 hover:text-red-500 hover:bg-white 
                        transition-all duration-300 z-50 cursor-pointer
                        opacity-0 group-hover:opacity-100 
                        translate-y-[-10px] group-hover:translate-y-0
                        hover:scale-110
                        ${wishlistAnimating ? 'animate-bounce-subtle' : ''}
                    `}
                    title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`w-5 h-5 transition-all duration-300 ${isInWishlist ? "fill-red-500 text-red-500 scale-110" : "fill-transparent stroke-current"}`}
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                </button>

                {/* Add to Cart Button with slide-up animation */}
                <button
                    onClick={handleAddToCart}
                    disabled={isAdding || isAdded || noStock}
                    className={`
                        absolute bottom-4 left-4 right-4 backdrop-blur-md font-semibold py-3 rounded-xl 
                        opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 
                        transition-all duration-300 shadow-lg z-50 cursor-pointer 
                        flex items-center justify-center gap-2
                        btn-ripple
                        ${isAdded
                            ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                            : noStock
                                ? "bg-gradient-to-r from-rose-600 to-red-600 text-white"
                                : "bg-white/95 text-gray-900 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:text-white hover:scale-[1.02]"
                        }
                    `}
                >
                    {isAdding ? (
                        <span className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                    ) : isAdded ? (
                        <>
                            <span className="text-lg">✓</span> Added
                        </>
                    ) : noStock ? (
                        "Out of Stock"
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add to Cart
                        </>
                    )}
                </button>
            </div>

            {/* Content with enhanced typography */}
            <div className="flex flex-col justify-between p-4 flex-1">
                <div>
                    <Link to={`/product/${product._id}`} className="block group/title">
                        <h3 className="font-sora font-semibold text-gray-900 truncate text-base mb-1 group-hover/title:text-indigo-600 transition-colors duration-200">
                            {product.product_name}
                        </h3>
                    </Link>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">
                            {product.category_name || "Exclusive"}
                        </span>
                    </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors duration-200">
                        ₹{formatPrice(displayPrice)}
                    </span>
                    {product.stock > 0 && product.stock < 10 && (
                        <span className="text-xs text-orange-600 font-semibold px-2 py-1 bg-orange-50 rounded-full">
                            Only {product.stock} left
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
