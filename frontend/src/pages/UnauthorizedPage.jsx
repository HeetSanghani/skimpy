import { Link, useNavigate } from "react-router-dom";

export default function UnauthorizedPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0a0a0a] font-inter flex flex-col items-center justify-center px-4 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="fixed top-20 left-1/3 w-96 h-96 bg-amber-900/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="fixed bottom-20 right-1/3 w-96 h-96 bg-orange-900/15 rounded-full blur-[128px] pointer-events-none" />

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
                <div className="text-[7rem] leading-none mb-6 animate-float select-none">🔒</div>

                {/* Error code */}
                <div className="text-8xl font-sora font-extrabold bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent mb-4">
                    403
                </div>

                <h1 className="text-2xl font-sora font-bold text-white mb-3">
                    Access Denied
                </h1>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    You don't have permission to view this page. This area may require
                    seller or admin privileges.
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
                        to="/login"
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-full hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105"
                    >
                        Sign In
                    </Link>
                </div>

                {/* Info */}
                <p className="text-xs text-gray-600">
                    Want to become a seller?{" "}
                    <Link to="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                        Register here
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}
