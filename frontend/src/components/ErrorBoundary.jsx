/**
 * ErrorBoundary — catches uncaught React errors and shows a graceful fallback.
 * Prevents the entire app from going blank on JS errors.
 */
import { Component } from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error("[ErrorBoundary] Uncaught error:", error, info);
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 text-center">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-rose-900/15 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-md">
                    <div className="text-6xl mb-4">💥</div>
                    <h1 className="text-3xl font-black text-white mb-3">Something broke</h1>
                    <p className="text-gray-400 mb-2 text-sm leading-relaxed">
                        An unexpected error occurred. Don't worry — your data is safe.
                    </p>
                    <details className="mb-6 text-left bg-white/5 border border-white/10 rounded-xl p-4">
                        <summary className="text-gray-500 text-xs cursor-pointer">Error details</summary>
                        <pre className="text-red-400 text-xs mt-2 overflow-auto whitespace-pre-wrap">
                            {this.state.error?.message}
                        </pre>
                    </details>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition"
                        >
                            Reload Page
                        </button>
                        <Link to="/" onClick={() => this.setState({ hasError: false, error: null })}
                            className="px-5 py-2.5 bg-white/8 border border-white/12 text-gray-300 font-semibold rounded-xl hover:bg-white/12 transition"
                        >
                            Go Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }
}
