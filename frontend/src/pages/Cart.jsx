import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import CateNavbar from '../components/CategoryNavbar';
import Footer from '../components/Footer';
import axios from "axios";
import { getCartItems, updateCartItemQuantity, removeFromCart } from '../api/cartApi';
import { fetchProfileThunk } from "../features/auth/authSlice";
import ProfileCompletionModal from "../components/ProfileCompletionModal";
import AddressModal from "../components/AddressModal";
import { useConfirmation } from "../context/ConfirmationContext";
import { API_BASE_URL } from "../api/baseUrl";
import { useSEO } from "../hooks/useSEO";

const BASE_URL = API_BASE_URL;
// Normalize image URL
const normalizeImage = (img) => {
    if (!img) return "https://via.placeholder.com/200x200?text=No+Image";
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    return `${BASE_URL}${img.startsWith("/") ? img : `/${img}`}`;
};

// Format delivery date as "Monday, 17 Nov"
const formatDeliveryDate = (daysFromNow = 4) => {
    const d = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
    const options = { weekday: "long", day: "numeric", month: "short" };
    return d.toLocaleDateString(undefined, options); // locale uses client default
};

export default function Cart() {
    useSEO({
        title: "Shopping Cart — Skimpy",
        description: "Review your cart items and checkout securely on Skimpy.",
        url: "/my-cart",
    });
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { token, user } = useSelector((state) => state.auth);
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { showConfirm } = useConfirmation();
    // For remove confirmation modal
    // const [removeConfirmId, setRemoveConfirmId] = useState(null);
    const [removing, setRemoving] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [missingFields, setMissingFields] = useState([]);

    // Address logic
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
    const [deliveryAddresses, setDeliveryAddresses] = useState([]);
    const [fetchingAddresses, setFetchingAddresses] = useState(false);

    // Fetch addresses
    const fetchAddresses = async () => {
        if (!token) return;
        try {
            setFetchingAddresses(true);
            const res = await axios.get(`${BASE_URL}/user/settings/get-delivery-address`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeliveryAddresses(res.data || []);
        } catch (error) {
            console.error("Error fetching addresses", error);
        } finally {
            setFetchingAddresses(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, [token]);

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
        // At least one Delivery Address - we check this manually via the new UI now
        if (!user.avatar) missing.push("Profile Avatar");

        return missing;
    };

    // Fetch cart items
    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        let mounted = true;
        const fetchCartItems = async () => {
            try {
                setLoading(true);
                const raw = await getCartItems();

                // Normalize API payload to a flat array of cart items
                const items = Array.isArray(raw)
                    ? raw
                    : Array.isArray(raw?.items)
                        ? raw.items
                        : Array.isArray(raw?.cart_items)
                            ? raw.cart_items
                            : [];

                if (!mounted) return;
                setCartItems(items);
            } catch (err) {
                console.error("Error fetching cart:", err);
                setError("Failed to load cart items");
            } finally {
                if (mounted) setLoading(false);
            }
        };
        fetchCartItems();
        return () => {
            mounted = false;
        };
    }, [token]);
    // Update quantity
    const updateQuantity = async (cartItemId, currentQuantity, change) => {
        if (!token) {
            navigate("/login");
            return;
        }
        const newQuantity = Math.max(1, currentQuantity + change);

        // Optimistic UI update
        setCartItems((items) =>
            items.map((item) =>
                item._id === cartItemId ? { ...item, quantity: newQuantity } : item
            )
        );

        try {
            await updateCartItemQuantity(cartItemId, newQuantity);
        } catch (err) {
            toast.error("Failed to update quantity");
            // Revert on failure
            try {
                const fresh = await getCartItems();
                setCartItems(fresh || []);
            } catch (e) {
                // ignore
            }
        }
    };

    // Remove item (show modal first)
    const handleRemove = (cartItemId) => {
        showConfirm({
            title: "Remove Item",
            message: "Are you sure you want to remove this item from your cart?",
            confirmText: "Remove",
            type: "danger",
            onConfirm: async () => {
                if (!token) {
                    navigate("/login");
                    return;
                }
                setRemoving(true);
                try {
                    await removeFromCart(cartItemId);
                    setCartItems((items) => items.filter((item) => item._id !== cartItemId));
                    toast.success("Item removed");
                } catch (err) {
                    console.error("Error removing item:", err);
                    toast.error("Failed to remove item");
                } finally {
                    setRemoving(false);
                }
            }
        });
    };

    // Stripe Checkout Handler
    const payNow = async () => {
        try {
            if (cartItems.length === 0) {

                toast.error("Your cart is empty!");
                return;
            }

            // Check Profile
            const missing = validateProfile();
            // If profile is missing basic fields, show modal
            if (missing.length > 0) {
                // If the only missing field is "At least one Delivery Address", we ignore it here
                // because we handle address selection natively in Cart now.
                const realMissing = missing.filter(m => m !== "At least one Delivery Address");
                if (realMissing.length > 0) {
                    setMissingFields(realMissing);
                    setShowProfileModal(true);
                    return;
                }
            }

            // Ensure address is selected
            if (deliveryAddresses.length === 0) {
                toast.error("Please add a delivery address first.");
                setShowAddressModal(true);
                return;
            }

            const selectedAddr = deliveryAddresses[selectedAddressIndex];
            if (!selectedAddr) {
                toast.error("Please select a delivery address.");
                return;
            }

            const itemsPayload = cartItems.map((item) => {
                const product = item.product || {};
                const variant = item.variant || {};

                return {
                    product_id: product._id || product.id,
                    variant_id: variant._id || variant.id || null, // Ensure null if undefined
                    quantity: item.quantity,
                };
            });

            const payload = {
                items: itemsPayload,
                address_id: selectedAddr.address_id || selectedAddr._id || selectedAddr.id
            };

            const response = await axios.post(
                `${BASE_URL}/payment/create-checkout-session`,
                payload,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}` // Ensure token is sent
                    }
                }
            );

            window.location.href = response.data.checkout_url;
        } catch (err) {
            console.error("❌ Stripe Checkout Error:", err.response?.data || err);
            if (err.response?.status === 403) {
                toast.error(`Profile Incomplete: ${err.response.data.detail}`);
            } else if (err.response?.status === 401) {
                toast.error("Please login to proceed.");
                navigate("/login");
            } else {
                toast.error(err.response?.data?.detail || "Payment failed. Please try again.");
            }
        }
    };

    // Calculate total
    const totalPrice = (Array.isArray(cartItems) ? cartItems : []).reduce((total, item) => {
        const price = item.variant?.price || item.product?.price || 0;
        return total + price * item.quantity;
    }, 0);
    // Get product display info
    const getProductInfo = (item) => {
        const product = item.product || {};
        const variant = item.variant || {};

        const name = product.product_name || product.name || "Unknown Product";
        const price = variant.price || product.price || 0;

        // Get image from variant or product
        let image = null;
        if (variant.images && Array.isArray(variant.images) && variant.images.length > 0) {
            image = variant.images[0];
        } else if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            image = product.images[0];
        } else if (product.image) {
            image = product.image;
        }

        return { name, price, image: normalizeImage(image), product, variant };
    };

    // Skeleton UI used while loading
    const CartSkeleton = () => (
        <div className="space-y-4 w-full">
            {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-4">
                        <div className="w-24 h-24 bg-gray-200 rounded"></div>
                        <div className="space-y-2">
                            <div className="w-40 h-4 bg-gray-200 rounded"></div>
                            <div className="w-24 h-4 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                        <div className="w-24 h-4 bg-gray-200 rounded"></div>
                        <div className="w-28 h-10 bg-gray-200 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    // Render empty cart view
    const EmptyCart = () => (
        <div className="text-center py-12">
            <img
                src="https://cdn-icons-png.flaticon.com/512/2331/2331970.png"
                alt="Empty Cart"
                className="w-36 mx-auto mb-6 opacity-90"
            />

            <h3 className="text-2xl font-semibold mb-2">Your cart is empty</h3>

            <p className="text-gray-600 mb-6">
                Add items you love and they'll appear here.
            </p>

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




    // Single-column layout: token guard
    if (!token) {
        return (
            <>
                <Navbar />
                <CateNavbar />
                <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-2xl p-8 rounded-2xl shadow-md text-center">
                        <p className="text-gray-600 text-lg mb-4">Please login to view your cart</p>
                        <button
                            onClick={() => navigate("/login")}
                            className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-900"
                        >
                            Login
                        </button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    // Loading skeleton
    if (loading) {
        return (
            <>
                <Navbar />
                <CateNavbar />
                <div className="min-h-screen bg-gray-100 p-6">
                    <div className="bg-white w-full max-w-4xl mx-auto p-6 rounded-2xl shadow-md">
                        <h2 className="text-2xl font-extrabold mb-4">Shopping Cart</h2>
                        <CartSkeleton />
                    </div>
                </div>
                <Footer />
            </>
        );
    }
    return (
        <>
            <Navbar />
            <CateNavbar />
            <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 tracking-tight">Shopping Cart</h2>

                    {error && (
                        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    {cartItems.length === 0 ? (
                        <EmptyCart />
                    ) : (
                        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
                            {/* CART ITEMS LIST (Span 8) */}
                            <div className="lg:col-span-8 space-y-4">
                                {cartItems.map((item) => {
                                    const { name, price, image, product, variant } = getProductInfo(item);
                                    const variantLines = [];
                                    if (variant?.size) variantLines.push(`Size: ${variant.size}`);
                                    if (variant?.color) variantLines.push(`Color: ${variant.color}`);
                                    if (variant?.material) variantLines.push(`Material: ${variant.material}`);
                                    if (variant?.sku) variantLines.push(`${variant.sku}`);

                                    return (
                                        <div
                                            key={item._id}
                                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md"
                                        >
                                            <div className="flex items-start space-x-4 w-full sm:w-auto">
                                                <img src={image} alt={name} className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-lg bg-gray-50 border border-gray-100" />
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">{name}</h3>
                                                    {variantLines.length > 0 ? (
                                                        <p className="text-sm text-gray-500 mt-0.5">{variantLines.join(" | ")}</p>
                                                    ) : (
                                                        product?.description && <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{product.description}</p>
                                                    )}
                                                    <div className="mt-1.5 font-bold text-gray-900">₹{price.toFixed(2)}</div>
                                                </div>
                                            </div>

                                            {/* Quantity & Remove */}
                                            <div className="flex items-center justify-between w-full sm:w-auto mt-4 sm:mt-0 sm:gap-6">
                                                <div className="flex items-center border rounded-lg bg-gray-50">
                                                    <button
                                                        onClick={() => updateQuantity(item._id, item.quantity, -1)}
                                                        className="px-3 py-1.5 hover:bg-gray-200 text-gray-600 font-bold transition rounded-l-lg"
                                                    >
                                                        −
                                                    </button>
                                                    <div className="px-3 py-1.5 font-semibold text-sm w-8 text-center bg-white border-x">
                                                        {item.quantity}
                                                    </div>
                                                    <button
                                                        onClick={() => updateQuantity(item._id, item.quantity, 1)}
                                                        className="px-3 py-1.5 hover:bg-gray-200 text-gray-600 font-bold transition rounded-r-lg"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => handleRemove(item._id)}
                                                    className="text-red-500 hover:text-red-700 font-medium text-sm transition px-2 py-1 hover:bg-red-50 rounded"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* ORDER SUMMARY (Span 4) */}
                            <div className="lg:col-span-4 mt-8 lg:mt-0">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:sticky lg:top-24">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>

                                    <div className="space-y-3 pb-4 border-b border-gray-100">
                                        <div className="flex justify-between text-gray-600">
                                            <span>Subtotal ({cartItems.length} items)</span>
                                            <span>₹{totalPrice.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600">
                                            <span>Shipping</span>
                                            <span className="text-green-600">Free</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center py-4">
                                        <span className="text-lg font-bold text-gray-900">Total</span>
                                        <span className="text-xl font-extrabold text-indigo-600">₹{totalPrice.toFixed(2)}</span>
                                    </div>

                                    <div className="bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-6">
                                        Free delivery on this order. Arrives by <strong>{formatDeliveryDate(4)}</strong>
                                    </div>

                                    {/* ADDRESS SECTION */}
                                    <div className="mb-6">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-semibold text-gray-900 text-sm">Shipping Address</h4>
                                            <button
                                                onClick={() => setShowAddressModal(true)}
                                                className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-3 py-1 rounded-full hover:bg-indigo-100 transition"
                                            >
                                                + Add New
                                            </button>
                                        </div>

                                        {fetchingAddresses ? (
                                            <div className="text-sm text-gray-400 animate-pulse">Loading addresses...</div>
                                        ) : deliveryAddresses.length === 0 ? (
                                            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 cursor-pointer hover:bg-amber-100 transition" onClick={() => setShowAddressModal(true)}>
                                                ⚠️ No address found. Click to add one.
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                                {deliveryAddresses.map((addr, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => setSelectedAddressIndex(idx)}
                                                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedAddressIndex === idx
                                                            ? 'border-indigo-600 bg-indigo-50/50'
                                                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                                                    >
                                                        <div className="flex gap-3">
                                                            <div className={`mt-0.5 w-4 h-4 min-w-[1rem] rounded-full border flex items-center justify-center ${selectedAddressIndex === idx ? 'border-indigo-600' : 'border-gray-400'}`}>
                                                                {selectedAddressIndex === idx && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                                                            </div>
                                                            <div className="text-xs sm:text-sm">
                                                                <p className="font-bold text-gray-900">{addr.first_name} {addr.last_name}</p>
                                                                <p className="text-gray-600 line-clamp-2 mt-0.5">
                                                                    {[addr.street_address, addr.city, addr.state, addr.postcode].filter(Boolean).join(", ")}
                                                                </p>
                                                                <p className="text-gray-500 mt-1">📞 {addr.phone}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <button
                                            onClick={payNow}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all"
                                        >
                                            Checkout with Stripe
                                        </button>

                                        <button
                                            onClick={() => navigate("/products")}
                                            className="w-full bg-white border border-gray-200 text-gray-700 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
                                        >
                                            Continue Shopping
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>



            <ProfileCompletionModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                missingFields={missingFields}
            />
            <AddressModal
                isOpen={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                onAddressAdded={fetchAddresses}
            />
            <Footer />
        </>
    );
}
