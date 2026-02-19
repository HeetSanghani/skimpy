import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRouter from "./routes/AppRouter";
import { ConfirmationProvider } from "./context/ConfirmationContext";

// If you have a Navbar or Footer, you can import them too
// import Navbar from "./components/Navbar";
// import Footer from "./components/Footer";



function App() {
  return (
    <ConfirmationProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 overflow-x-hidden">
          {/* Optional Navbar */}
          {/* <Navbar /> */}

          <main className="flex-grow w-full min-h-screen">
            {/* All your route-based pages will load here */}
            <AppRouter />

          </main>

          {/* Optional Footer */}
          {/* <Footer /> */}
        </div>
      </Router>
    </ConfirmationProvider>
  );
}

export default App;
