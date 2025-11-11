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

export default function Cart() {
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cart items
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchCartItems = async () => {
      try {
        setLoading(true);
        const items = await getCartItems();
        setCartItems(items);
      } catch (err) {
        console.error("Error fetching cart:", err);
        setError("Failed to load cart items");
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [token]);

  // Update quantity
  const updateQuantity = async (cartItemId, currentQuantity, change) => {
    if (!token) {
      navigate("/login");
      return;
    }

    const newQuantity = Math.max(1, currentQuantity + change);
    try {
      await updateCartItemQuantity(cartItemId, newQuantity);
      setCartItems((items) =>
        items.map((item) =>
          item._id === cartItemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (err) {
      console.error("Error updating quantity:", err);
      alert("Failed to update quantity");
    }
  };

  // Remove item
  const removeItem = async (cartItemId) => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      await removeFromCart(cartItemId);
      setCartItems((items) => items.filter((item) => item._id !== cartItemId));
    } catch (err) {
      console.error("Error removing item:", err);
      alert("Failed to remove item");
    }
  };


// ✅ Stripe Checkout Handler
const payNow = async () => {
  try {
    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    console.log("🛒 Sending cart checkout request...");

    const response = await axios.post(
      `${BASE_URL}/payment/create-checkout-session`,
      {
        product_name: "Cart Purchase",     // can be generic since multiple items
        amount: totalPrice * 100,          // ₹ to paise
        product_id: null,                  // optional for cart
        variant_id: null,
      },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("✅ Redirecting to Stripe:", response.data.checkout_url);
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
    
    return { name, price, image: normalizeImage(image) };
  };

  if (!token) {
    return (
      <>
        <Navbar />
        <CateNavbar />
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
          <div className="bg-white w-full p-8 rounded-2xl shadow-md text-center">
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

  if (loading) {
    return (
      <>
        <Navbar />
        <CateNavbar />
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
          <div className="bg-white w-full p-8 rounded-2xl shadow-md text-center">
            <p className="text-gray-600 text-lg">Loading cart...</p>
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
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
          <div className="bg-white w-full p-8 rounded-2xl shadow-md">
          {/* Heading */}
          <h2 className="text-3xl font-extrabold text-center mb-8 tracking-tight">
            Shopping Cart
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {cartItems.length === 0 ? (
            <p className="text-center text-gray-600 text-lg">
              Your cart is empty.
            </p>
          ) : (
            <div className="space-y-6">
              {/* Cart Items */}
              {cartItems.map((item) => {
                const { name, price, image } = getProductInfo(item);
                return (
                  <div
                    key={item._id}
                    className="flex flex-col md:flex-row items-center justify-between border-b pb-6"
                  >
                    <div className="flex items-center space-x-4">
                      <img
                        src={image}
                        alt={name}
                        className="w-28 h-28 object-contain"
                      />
                      <div>
                        <h3 className="text-lg font-semibold">{name}</h3>
                        <p className="text-gray-600">₹{price.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Quantity & Remove */}
                    <div className="flex items-center mt-4 md:mt-0 space-x-6">
                      <div className="flex items-center border rounded-md">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity, -1)}
                          className="px-3 py-1 text-lg hover:bg-gray-200"
                        >
                          -
                        </button>
                        <span className="px-4">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity, 1)}
                          className="px-3 py-1 text-lg hover:bg-gray-200"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item._id)}
                        className="text-red-500 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Total Price */}
              <div className="flex justify-between items-center pt-6 border-t">
                <h3 className="text-xl font-semibold">Total</h3>
                <p className="text-xl font-bold">₹{totalPrice.toFixed(2)}</p>
              </div>

              {/* Checkout Button */}
            <button
              onClick={payNow}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-md transition-colors duration-300"
            >
              Pay with Stripe
            </button>

            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
