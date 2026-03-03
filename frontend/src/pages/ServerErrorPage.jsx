import { Link } from "react-router-dom";

export default function ServerErrorPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] font-inter flex flex-col items-center justify-center px-4 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="fixed top-20 left-1/4 w-96 h-96 bg-rose-900/20 rounded-full blur-[128px] pointer-events-none" />
            <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-orange-900/15 rounded-full blur-[128px] pointer-events-none" />

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
                <div className="text-[7rem] leading-none mb-6 animate-float select-none">⚡</div>

                {/* Error code */}
                <div className="text-8xl font-sora font-extrabold bg-gradient-to-r from-rose-400 via-orange-400 to-amber-400 bg-clip-text text-transparent mb-4">
                    500
                </div>

                <h1 className="text-2xl font-sora font-bold text-white mb-3">
                    Something Went Wrong
                </h1>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    Our servers hit an unexpected bump. Our team has been notified and
                    is working on a fix. Please try again shortly.
                </p>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 justify-center mb-10">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 border border-white/15 text-gray-300 font-semibold rounded-full hover:bg-white/5 hover:text-white transition-all duration-200"
                    >
                        Try Again
                    </button>
                    <Link
                        to="/"
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-full hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105"
                    >
                        Go Home
                    </Link>
                </div>

                {/* Status info */}
                <p className="text-xs text-gray-600">
                    If this keeps happening, please{" "}
                    <Link to="/contact" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                        contact support
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}
