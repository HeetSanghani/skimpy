import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserOrders } from "../api/orderApi";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { SkeletonList } from "../components/Skeletons";

const INITIAL_LIMIT = 4;

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingAll, setLoadingAll] = useState(false);
    const [showAll, setShowAll] = useState(false);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await getUserOrders(100, 0); // fetch all, display limited
            setAllOrders(data || []);
            setOrders((data || []).slice(0, INITIAL_LIMIT));
        } catch (error) {
            console.error("Failed to load orders:", error);
            toast.error("Could not load orders.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleLoadAll = () => {
        setOrders(allOrders);
        setShowAll(true);
    };

    if (loading && orders.length === 0)
        return (
            <div className="flex min-h-screen flex-col bg-[#0a0a0a] font-sora">
                <Navbar />
                <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
                    <div className="h-8 w-48 bg-white/8 rounded-lg mb-6 animate-pulse" />
                    <SkeletonList rows={5} />
                </div>
                <Footer />
            </div>
        );

    return (
        <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-inter">
            <Navbar />
            <div className="flex-1 pb-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Header */}
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-sora font-extrabold tracking-tight text-slate-900">
                            My <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Orders</span>
                        </h1>
                        <p className="mt-3 text-slate-500 font-medium text-lg">Track your history and status.</p>
                    </div>

                    {orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/60 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-xl text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                <span className="text-4xl">🛍️</span>
                            </div>
                            <h2 className="text-2xl font-sora font-bold text-slate-900 mb-2">No orders found</h2>
                            <p className="text-slate-500 mb-8 max-w-sm">Looks like you haven't discovered our collection yet.</p>
                            <Link
                                to="/products"
                                className="px-8 py-3.5 bg-gradient-to-r from-gray-900 to-black text-white rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
                            >
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {orders.map((order) => (
                                <div
                                    key={order._id || order.order_id}
                                    className="group relative bg-white/70 backdrop-blur-md rounded-[2rem] border border-white/50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden"
                                >
                                    {/* Decorative Gradient Blur */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>

                                    <div className="relative p-6 md:p-8">
                                        {/* Order Header */}
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-100 pb-6">
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Order ID</p>
                                                <p className="text-xl font-sora font-bold text-slate-900 tracking-tight">#{order.order_id}</p>
                                                <p className="text-sm text-slate-500 font-medium">
                                                    Placed on {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </p>
                                            </div>

                                            <div className={`px-5 py-2 rounded-full flex items-center gap-2 border ${['Approved', 'Delivered', 'Completed'].includes(order.status) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                ['Rejected', 'Cancelled'].includes(order.status) ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                    ['Processing', 'Shipped'].includes(order.status) ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full ${['Approved', 'Delivered', 'Completed'].includes(order.status) ? 'bg-emerald-500 animate-pulse' :
                                                    ['Rejected', 'Cancelled'].includes(order.status) ? 'bg-rose-500' :
                                                        ['Processing', 'Shipped'].includes(order.status) ? 'bg-blue-500 animate-pulse' :
                                                            'bg-amber-500 animate-pulse'
                                                    }`}></span>
                                                <span className="font-sora font-semibold text-sm">{order.status}</span>
                                            </div>
                                        </div>

                                        {/* Products Grid */}
                                        <div className="space-y-6">
                                            {order.products.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-6 p-4 rounded-xl hover:bg-white/50 transition-colors border border-transparent hover:border-white/60">
                                                    <div className="h-20 w-20 rounded-xl overflow-hidden shadow-sm border border-slate-100 flex-shrink-0 bg-white">
                                                        <img
                                                            src={item.image || "https://via.placeholder.com/150"}
                                                            alt={item.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-sora font-bold text-slate-900 text-lg truncate">{item.name}</h3>
                                                        <p className="text-slate-500 text-sm mt-1">Quantity: <span className="font-semibold text-slate-700">{item.quantity}</span></p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-sora font-bold text-slate-900 text-lg">₹{(item.price * item.quantity).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Footer / Actions */}
                                        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 font-medium">Total Amount:</span>
                                                <span className="text-2xl font-sora font-extrabold text-slate-900">₹{order.total_amount.toLocaleString()}</span>
                                            </div>

                                            <Link
                                                to={`/my-orders/${order._id || order.order_id}`}
                                                className="w-full md:w-auto px-8 py-3 rounded-xl bg-slate-900 text-white font-sora font-semibold text-sm hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 text-center"
                                            >
                                                View Order Details
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!showAll && allOrders.length > INITIAL_LIMIT && (
                        <div className="text-center pt-12">
                            <button
                                onClick={handleLoadAll}
                                disabled={loadingAll}
                                className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-sora font-bold rounded-full hover:from-indigo-700 hover:to-violet-700 hover:scale-105 transition-all shadow-md hover:shadow-indigo-300 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                View All Orders ({allOrders.length})
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Orders;
