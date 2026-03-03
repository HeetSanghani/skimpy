import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createOrderFromCart } from "../api/orderApi";
import { fetchAddresses } from "../features/settings/settingsSlice";
import { verifyPaymentSession } from "../api/paymentApi";
import toast from "react-hot-toast";
import { Analytics } from "../utils/analytics";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { CheckCircle, Package, ArrowRight, ShoppingBag, Home } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const { addresses } = useSelector((state) => state.settings);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState(null);
  const [failed, setFailed] = useState(false);
  const processedRef = useRef(false);

  // Estimated delivery: 4–6 days
  const deliveryDate = () => {
    const d = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  };

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const queryParams = new URLSearchParams(window.location.search);
    const sessionId = queryParams.get("session_id");

    const processOrder = async () => {
      if (processedRef.current) return;
      processedRef.current = true;

      // New Verify Flow
      if (sessionId) {
        try {
          await verifyPaymentSession(sessionId);
          setOrderId("success");
          toast.success("🎉 Order placed successfully!");
          Analytics.purchase(sessionId, null);
        } catch (err) {
          setFailed(true);
          toast.error("Failed to verify payment. Please contact support.");
        } finally {
          setLoading(false);
        }
        return;
      }

      // Legacy Flow (Fallback)
      try {
        let addressList = addresses;
        if (!addressList || addressList.length === 0) {
          try {
            const res = await dispatch(fetchAddresses()).unwrap();
            addressList = res;
          } catch (e) { console.warn("Address fetch failed", e); }
        }

        const primaryAddr = addressList && addressList.length > 0 ? addressList[0] : null;
        const shippingAddress = {
          fullname: primaryAddr
            ? `${primaryAddr.first_name} ${primaryAddr.last_name}`
            : (user?.first_name ? `${user.first_name} ${user.last_name}` : "Valued Customer"),
          address_line1: primaryAddr ? primaryAddr.street_address : (user?.address || "123 Main St"),
          city: primaryAddr?.city || "Mumbai",
          state: primaryAddr?.state || "Maharashtra",
          pincode: primaryAddr?.postcode ? String(primaryAddr.postcode) : "400001",
          country: primaryAddr?.country || "India",
          phone: primaryAddr?.phone || user?.phone || "9999999999"
        };

        let attempts = 0, success = false;
        while (attempts < 3 && !success) {
          try {
            await createOrderFromCart(shippingAddress, "pay_stripe_session_completed");
            success = true;
            setOrderId("success");
            toast.success("🎉 Order placed successfully!");
          } catch (err) {
            attempts++;
            if (attempts < 3) await new Promise(r => setTimeout(r, 1000));
          }
        }
        if (!success) {
          setFailed(true);
          toast.error("Order creation failed after 3 attempts. Please contact support.");
        }
      } catch (error) {
        setFailed(true);
        toast.error("Failed to process order details.");
      } finally {
        setLoading(false);
      }
    };

    processOrder();
  }, [token, dispatch, navigate, user, addresses]);

  // ── Loading State ──
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#0a0a0a] px-4">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-t-4 border-indigo-500 animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-white animate-pulse">Confirming your order…</h2>
          <p className="text-gray-500 text-sm mt-2">Please don't close this window</p>
        </div>
        <Footer />
      </>
    );
  }

  // ── Error/Failure State ──
  if (failed) {
    return (
      <>
        <Navbar />
        <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[#0a0a0a] px-4">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-gray-400 text-center max-w-sm mb-8">
            Your payment was processed but we couldn't create your order. Please contact support with your session ID.
          </p>
          <div className="flex gap-3">
            <Link to="/my-orders" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition">
              Check My Orders
            </Link>
            <Link to="/contact" className="px-5 py-2.5 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/15 transition">
              Contact Support
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // ── Success State ──
  return (
    <>
      <Navbar />
      <div className="min-h-[80vh] bg-[#0a0a0a] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">

          {/* Glow card */}
          <div className="relative bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">

            {/* Background gradient glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Animated check icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center animate-[scale_0.5s_ease-out]">
                  <CheckCircle className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
                </div>
                {/* Ping ring */}
                <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping opacity-40" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Payment Successful!</h1>
              <p className="text-gray-400 text-sm">
                Thank you for your purchase. Your order is confirmed and being processed.
              </p>
            </div>

            {/* Order info cards */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/8">
                <div className="w-10 h-10 rounded-full bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Order Status</p>
                  <p className="text-white font-semibold text-sm">Pending Priority Approval</p>
                </div>
                <span className="ml-auto px-2.5 py-1 text-xs font-bold bg-amber-400/10 text-amber-300 border border-amber-400/20 rounded-full">
                  Processing
                </span>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/8">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🚚</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Estimated Delivery</p>
                  <p className="text-white font-semibold text-sm">{deliveryDate()}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/8">
                <div className="w-10 h-10 rounded-full bg-sky-500/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">📧</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Confirmation</p>
                  <p className="text-white font-semibold text-sm">Invoice sent to your email</p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/my-orders"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-900/40 hover:-translate-y-0.5"
              >
                <Package size={16} />
                View My Orders
                <ArrowRight size={14} />
              </Link>
              <Link
                to="/"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/8 border border-white/12 text-gray-300 font-semibold rounded-xl hover:bg-white/12 transition-all duration-200"
              >
                <Home size={16} />
                Back to Home
              </Link>
            </div>

            {/* Continue shopping */}
            <div className="mt-4 text-center">
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-400 transition-colors duration-200"
              >
                <ShoppingBag size={14} />
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Bottom reassurance */}
          <p className="text-center text-xs text-gray-600 mt-6">
            Questions? <Link to="/contact" className="text-indigo-400 hover:underline">Contact our support team</Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PaymentSuccess;
