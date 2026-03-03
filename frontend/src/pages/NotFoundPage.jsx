import { Link, useNavigate } from "react-router-dom";

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0a0a0a] font-inter flex flex-col items-center justify-center px-4 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="fixed top-20 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-purple-900/15 rounded-full blur-[128px] pointer-events-none" />

            <div className="relative z-10 text-center max-w-lg mx-auto animate-fade-in">
                {/* Logo */}
                <Link to="/" className="inline-flex items-center gap-2 mb-10 group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
                        <span className="text-white font-black text-base leading-none">S</span>
                    </div>
                    <span className="font-sora font-extrabold text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        SKIMPY
                    </span>
                </Link>

                {/* Illustration */}
                <div className="text-[7rem] leading-none mb-6 animate-float select-none">🔍</div>

                {/* Error code */}
                <div className="text-8xl font-sora font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-400 bg-clip-text text-transparent mb-4">
                    404
                </div>

                <h1 className="text-2xl font-sora font-bold text-white mb-3">
                    Page Not Found
                </h1>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    The page you're looking for doesn't exist or may have been moved.
                    Let's get you back on track.
                </p>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 justify-center mb-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 border border-white/15 text-gray-300 font-semibold rounded-full hover:bg-white/5 hover:text-white transition-all duration-200"
                    >
                        ← Go Back
                    </button>
                    <Link
                        to="/"
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-full hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105"
                    >
                        Go Home
                    </Link>
                </div>

                {/* Helpful links */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center text-sm">
                    {[
                        { to: "/products", label: "Browse Products" },
                        { to: "/login", label: "Sign In" },
                        { to: "/sell", label: "Start Selling" },
                        { to: "/contact", label: "Contact Support" },
                    ].map(({ to, label }) => (
                        <Link
                            key={to}
                            to={to}
                            className="text-gray-500 hover:text-indigo-400 transition-colors duration-200"
                        >
                            {label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
