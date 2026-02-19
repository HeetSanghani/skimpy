import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getOrderById } from "../api/orderApi";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const BASE_URL = "/orders";

const OrderDetails = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { token } = useSelector((state) => state.auth);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!token) return;
            try {
                setLoading(true);
                // Use the new endpoint
                const data = await getOrderById(orderId);
                setOrder(data);
            } catch (err) {
                console.error(err);
                toast.error("Order not found or access denied");
                navigate("/my-orders");
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId, token, navigate]);

    // Status Order
    const statusSteps = ["Pending Priority Approval", "Approved", "Processing", "Shipped", "Delivered"];
    const currentStepIdx = order ? statusSteps.indexOf(order.status) : -1;

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!order) return <div className="p-10 text-center">Order not found.</div>;

    return (
        <div className="max-w-4xl mx-auto py-10 px-6">
            <button onClick={() => navigate("/my-orders")} className="mb-6 text-gray-500 hover:text-black">
                ← Back to Orders
            </button>

            <div className="bg-white border rounded-xl shadow-sm p-6 mb-8">
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                    <h1 className="text-2xl font-bold">Order #{order.order_id}</h1>
                    <span className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</span>
                </div>

                {/* Timeline */}
                <div className="mb-8">
                    <h3 className="font-semibold mb-4">Order Status</h3>

                    {/* Scrollable Timeline Container for Mobile */}
                    <div className="relative overflow-x-auto pb-6 scrollbar-hide md:overflow-visible">
                        <div className="flex justify-between items-center min-w-[320px] md:min-w-0 px-2">
                            {/* Line background - Hidden on mobile if preferred, or kept for continuity */}
                            <div className="absolute top-4 left-0 w-full h-1 bg-gray-100 -z-0"></div>

                            {/* Active Line Progress */}
                            <div
                                className="absolute top-4 left-0 h-1 bg-black -z-0 transition-all duration-500"
                                style={{ width: `${(currentStepIdx / (statusSteps.length - 1)) * 100}%` }}>
                            </div>

                            {statusSteps.map((step, idx) => {
                                const isCompleted = idx <= currentStepIdx;
                                const isCurrent = idx === currentStepIdx;
                                return (
                                    <div key={step} className="flex flex-col items-center z-10 w-24">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ring-4 ring-white
                                             ${isCompleted ? "bg-black text-white" : "bg-gray-200 text-gray-500"}`}>
                                            {idx + 1}
                                        </div>
                                        <span className={`text-[10px] md:text-xs mt-2 font-medium text-center ${isCurrent ? "text-black" : "text-gray-400"}`}>
                                            {step}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {order.status === "Rejected" && (
                        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-center font-semibold">
                            This order was rejected by the vendor.
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-semibold mb-2">Shipping Address</h3>
                        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">
                            {/* Address Content - Safe checks included */}
                            <p className="font-bold text-gray-900 text-base">{order.shipping_address?.fullname || "N/A"}</p>
                            <p className="mt-1">{order.shipping_address?.address_line1 || ""}</p>
                            <p>{[order.shipping_address?.city, order.shipping_address?.state, order.shipping_address?.pincode].filter(Boolean).join(", ")}</p>
                            <p className="mt-2 text-gray-500">📞 {order.shipping_address?.phone || "N/A"}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white border rounded-xl shadow-sm p-6">
                <h3 className="font-semibold mb-4">Items Order</h3>
                <div className="space-y-4">
                    {order.products.map((item, i) => (
                        <div key={i} className="flex gap-4 items-center">
                            <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-md bg-gray-100" />
                            <div className="flex-1">
                                <h4 className="font-medium">{item.name}</h4>
                                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-semibold">₹{item.price * item.quantity}</p>
                        </div>
                    ))}
                </div>
                <div className="border-t mt-6 pt-4 flex justify-between items-center text-lg font-bold">
                    <span>Total Amount</span>
                    <span>₹{order.total_amount}</span>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
