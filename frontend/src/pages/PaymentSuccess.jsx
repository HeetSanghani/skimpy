import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { createOrderFromCart } from "../api/orderApi";
import { fetchAddresses } from "../features/settings/settingsSlice";
import { verifyPaymentSession } from "../api/paymentApi";
import toast from "react-hot-toast";
import { Analytics } from "../utils/analytics";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const { addresses } = useSelector((state) => state.settings);
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState(null);
  const processedRef = useRef(false);

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
          toast.success("Order placed successfully!");
          Analytics.purchase(sessionId, null);
        } catch (err) {
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
            // Attempt to fetch address if missing
            const res = await dispatch(fetchAddresses()).unwrap();
            addressList = res;
          } catch (e) { console.warn("Address fetch failed", e); }
        }

        const primaryAddr = addressList && addressList.length > 0 ? addressList[0] : null;

        const shippingAddress = {
          fullname: primaryAddr
            ? `${primaryAddr.first_name} ${primaryAddr.last_name}`
            : (user?.first_name ? `${user.first_name} ${user.last_name}` : "Valued Customer"),

          address_line1: primaryAddr
            ? primaryAddr.street_address
            : (user?.address || "123 Main St"),

          city: primaryAddr?.city || "Mumbai",
          state: primaryAddr?.state || "Maharashtra",
          pincode: primaryAddr?.postcode ? String(primaryAddr.postcode) : "400001",
          country: primaryAddr?.country || "India",
          phone: primaryAddr?.phone || user?.phone || "9999999999"
        };

        // Retry Loop
        let attempts = 0;
        let success = false;
        while (attempts < 3 && !success) {
          try {
            console.log(`Attempting to create order (Try ${attempts + 1})...`);
            await createOrderFromCart(shippingAddress, "pay_stripe_session_completed");
            success = true;
            setOrderId("success");
            toast.success("Order placed successfully!");
          } catch (err) {
            console.error("Order creation attempt failed:", err);
            attempts++;
            if (attempts < 3) await new Promise(r => setTimeout(r, 1000)); // wait 1s
          }
        }

        if (!success) {
          toast.error("Critical: Order creation failed after 3 attempts. Please contact support.");
          // We could optionally save to local storage for manual retry logic later
        }

      } catch (error) {
        console.error("Order setup failed:", error);
        toast.error("Failed to process order details.");
      } finally {
        setLoading(false);
      }
    };

    processOrder();
  }, [token, dispatch, navigate, user, addresses]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <h2 className="text-2xl font-semibold animate-pulse">Processing your order...</h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-[70vh]">
      <h1 className="text-4xl font-semibold text-green-600">✅ Payment Successful!</h1>
      <p className="text-lg mt-4">Thank you for your purchase. Your order has been placed.</p>

      <div className="flex gap-4 mt-8">
        <Link
          to="/my-orders"
          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800"
        >
          View My Orders
        </Link>
        <Link
          to="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};


export default PaymentSuccess;
