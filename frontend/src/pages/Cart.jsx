import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from '../components/Navbar';
import CateNavbar from '../components/CategoryNavbar';
import Footer from '../components/Footer';
import axios from "axios";
import { getCartItems, updateCartItemQuantity, removeFromCart } from '../api/cartApi';
const BASE_URL = "http://localhost:8000";
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
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For remove confirmation modal
  const [removeConfirmId, setRemoveConfirmId] = useState(null);
  const [removing, setRemoving] = useState(false);

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
        const items = await getCartItems();
        if (!mounted) return;
        setCartItems(items || []);
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
      console.error("Error updating quantity:", err);
      alert("Failed to update quantity");
      // Revert on failure: refetch or revert locally (simple approach: refetch)
      try {
        const fresh = await getCartItems();
        setCartItems(fresh || []);
      } catch (e) {
        // ignore
      }
    }
  };

  // Remove item (show modal first)
  const confirmRemove = (id) => {
    setRemoveConfirmId(id);
  };

  const performRemove = async (cartItemId) => {
    if (!token) {
      navigate("/login");
      return;
    }
    setRemoving(true);
    try {
      await removeFromCart(cartItemId);
      setCartItems((items) => items.filter((item) => item._id !== cartItemId));
      setRemoveConfirmId(null);
    } catch (err) {
      console.error("Error removing item:", err);
      alert("Failed to remove item");
    } finally {
      setRemoving(false);
    }
  };

  // Stripe Checkout Handler
  const payNow = async () => {
    try {
      if (cartItems.length === 0) {
        alert("Your cart is empty!");
        return;
      }

      const payload = cartItems.map((item) => {
        const product = item.product || {};
        const variant = item.variant || {};

        return {
          name: product.product_name || product.name,
          price: variant.price || product.price,
          quantity: item.quantity,
          image: normalizeImage(
            (variant.images && variant.images[0]) ||
              (product.images && product.images[0]) ||
              product.image
          ),
          product_id: product._id || product.id,
          variant_id: variant._id || variant.id,
        };
      });

      console.log("🛒 Sending cart items to Stripe:", payload);

      const response = await axios.post(
        `${BASE_URL}/payment/create-checkout-session`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      window.location.href = response.data.checkout_url;
    } catch (err) {
      console.error("❌ Stripe Checkout Error:", err.response?.data || err);
      alert("Payment failed.");
    }
  };

  // Calculate total
  const totalPrice = cartItems.reduce((total, item) => {
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
      {[1,2,3].map((i) => (
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
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="bg-white w-full max-w-4xl mx-auto p-6 rounded-2xl shadow-md transition-all duration-300">
          <h2 className="text-3xl font-extrabold text-center mb-6 tracking-tight">Shopping Cart</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          {cartItems.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="space-y-6">
              {cartItems.map((item) => {
                const { name, price, image, product, variant } = getProductInfo(item);
                // Variant details string (size, color, etc.)
                const variantLines = [];
                if (variant?.size) variantLines.push(`Size: ${variant.size}`);
                if (variant?.color) variantLines.push(`Color: ${variant.color}`);
                if (variant?.material) variantLines.push(`Material: ${variant.material}`);
                if (variant?.sku) variantLines.push(`SKU: ${variant.sku}`);

                return (
                  <div
                    key={item._id}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-4 rounded-xl shadow-sm transition-transform duration-200 hover:scale-[1.01]"
                    aria-live="polite"
                  >
                    <div className="flex items-start md:items-center space-x-4">
                      <img src={image} alt={name} className="w-28 h-28 object-contain rounded" />
                      <div>
                        <h3 className="text-lg font-semibold">{name}</h3>
                        {/* Product/Variant details */}
                        {variantLines.length > 0 ? (
                          <p className="text-sm text-gray-500">{variantLines.join(" | ")}</p>
                        ) : (
                          product?.description && <p className="text-sm text-gray-500 max-w-md">{product.description}</p>
                        )}
                        <div className="mt-2">
                          <p className="text-gray-600 font-medium">₹{price.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    {/* Quantity & Remove */}
                    <div className="flex items-center mt-4 md:mt-0 space-x-4">
                      <div className="flex items-center border rounded-full overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity, -1)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 font-bold text-lg transition"
                          aria-label={`Decrease quantity of ${name}`}
                        >
                          −
                        </button>

                        <div className="px-5 py-2 font-semibold" aria-live="polite">
                          {item.quantity}
                        </div>

                        <button
                          onClick={() => updateQuantity(item._id, item.quantity, 1)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 font-bold text-lg transition"
                          aria-label={`Increase quantity of ${name}`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => confirmRemove(item._id)}
                        className="text-red-500 hover:text-red-700 font-medium transition"
                        aria-label={`Remove ${name} from cart`}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Summary Card (single-column, below items) */}
              <div className="bg-gray-50 p-4 rounded-xl border mt-2 transition">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Order Summary</h3>
                  <p className="text-sm text-gray-500">{cartItems.length} item(s)</p>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <span className="text-gray-600">Total</span>
                  <span className="text-xl font-bold">₹{totalPrice.toFixed(2)}</span>
                </div>

                <div className="mt-3">
                  <p className="text-sm text-green-600 font-medium">✓ Free delivery on orders above ₹499</p>
                  <p className="text-gray-500 text-sm mt-1">Deliver by {formatDeliveryDate(4)}</p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3">
                  <button
                    onClick={payNow}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-md transition"
                  >
                    Pay with Stripe
                  </button>

                  <button
                    onClick={() => navigate("/products")}
                    className="w-full bg-white border hover:bg-gray-50 text-black font-medium py-3 rounded-md transition"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Remove confirmation modal (simple accessible modal) */}
      {removeConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h4 className="text-lg font-semibold mb-2">Remove item</h4>
            <p className="text-gray-600 mb-4">Are you sure you want to remove this item from your cart?</p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRemoveConfirmId(null)}
                className="px-4 py-2 bg-white border rounded-md hover:bg-gray-50 transition"
                disabled={removing}
              >
                Cancel
              </button>
              <button
                onClick={() => performRemove(removeConfirmId)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                disabled={removing}
              >
                {removing ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}