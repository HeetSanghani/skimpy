import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRouter from "./routes/AppRouter";
import { ConfirmationProvider } from "./context/ConfirmationContext";
import { LoadingProvider } from "./context/LoadingContext";
import PageLoader from "./components/PageLoader";
import BackendGuard from "./components/BackendGuard";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BackendGuard>
      <LoadingProvider>
        <ConfirmationProvider>
          <Router>
            <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 overflow-x-hidden">
              {/* Global loading overlay (200ms threshold) */}
              <PageLoader />

              {/* Toast notifications */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3500,
                  style: {
                    background: "#1a1a2e",
                    color: "#e2e8f0",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontFamily: "Inter, sans-serif",
                  },
                  success: { iconTheme: { primary: "#6366f1", secondary: "#fff" } },
                  error: { iconTheme: { primary: "#f43f5e", secondary: "#fff" } },
                }}
              />

              <main className="flex-grow w-full min-h-screen">
                <AppRouter />
              </main>
            </div>
          </Router>
        </ConfirmationProvider>
      </LoadingProvider>
    </BackendGuard>
  );
}

export default App;
