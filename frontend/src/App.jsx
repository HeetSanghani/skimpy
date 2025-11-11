import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRouter from "./routes/AppRouter";

// If you have a Navbar or Footer, you can import them too
// import Navbar from "./components/Navbar";
// import Footer from "./components/Footer";



function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
        {/* Optional Navbar */}
        {/* <Navbar /> */}

        <main className="flex-grow w-full">
          {/* All your route-based pages will load here */}
          <AppRouter />
             
        </main>

        {/* Optional Footer */}
        {/* <Footer /> */}
      </div>
    </Router>
  );
}

export default App;



