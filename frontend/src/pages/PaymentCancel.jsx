import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ShoppingCart, ArrowLeft, ShoppingBag, Home } from "lucide-react";

const PaymentCancel = () => {
    const navigate = useNavigate();

    return (
        <>
            <Navbar />
            <div className="min-h-[80vh] bg-[#0a0a0a] flex items-center justify-center px-4 py-16">
                <div className="w-full max-w-lg">

                    {/* Card */}
                    <div className="relative bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden">

                        {/* Background glow */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-rose-500/8 rounded-full blur-3xl pointer-events-none" />

                        {/* Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                                <span className="text-4xl">🛒</span>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Payment Cancelled</h1>
                            <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                                No worries — you haven't been charged. Your cart items are safe and waiting for you.
                            </p>
                        </div>

                        {/* Info strip */}
                        <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/15 rounded-2xl mb-8">
                            <span className="text-amber-400 text-lg flex-shrink-0 mt-0.5">💡</span>
                            <p className="text-amber-300/80 text-sm">
                                Your cart has been saved. You can safely return and complete your purchase whenever you're ready.
                            </p>
                        </div>

                        {/* Steps reassurance */}
                        <div className="space-y-3 mb-8">
                            {[
                                { icon: "✅", label: "No payment was collected" },
                                { icon: "🛍️", label: "Your cart items are still saved" },
                                { icon: "🔒", label: "Your personal data is secure" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-white/4 rounded-xl border border-white/6">
                                    <span className="text-base">{item.icon}</span>
                                    <span className="text-gray-300 text-sm font-medium">{item.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                to="/my-cart"
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-900/40 hover:-translate-y-0.5"
                            >
                                <ShoppingCart size={16} />
                                Return to Cart
                            </Link>
                            <Link
                                to="/"
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/8 border border-white/12 text-gray-300 font-semibold rounded-xl hover:bg-white/12 transition-all duration-200"
                            >
                                <Home size={16} />
                                Back to Home
                            </Link>
                        </div>

                        {/* Browse link */}
                        <div className="mt-4 text-center">
                            <Link
                                to="/products"
                                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-400 transition-colors duration-200"
                            >
                                <ShoppingBag size={14} />
                                Browse more products
                            </Link>
                        </div>
                    </div>

                    {/* Support line */}
                    <p className="text-center text-xs text-gray-600 mt-6">
                        Facing issues? <Link to="/contact" className="text-indigo-400 hover:underline">Contact our support team</Link>
                    </p>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default PaymentCancel;
