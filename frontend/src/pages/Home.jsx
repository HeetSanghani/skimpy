// src/pages/Home.jsx
import React from "react";
import Navbar from "../components/Navbar";
import CategoryNavbar from "../components/CategoryNavbar";
import Footer from "../components/Footer";

export default function Home() {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar />
            
            <CategoryNavbar/>
           
           
            {/* Main content */}
            <main className="flex-grow container mx-auto px-4 py-8">
                <section className="text-center mb-10">
                    <h1 className="text-4xl font-bold mb-4 text-gray-800">
                        Welcome to Marketplace
                    </h1>
                    <p className="text-lg text-gray-600">
                        Your one-stop shop for amazing products at great prices.
                    </p>
                </section>

                <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {/* Sample product cards for testing layout */}
            {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div key={item} className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition">
                            <div className="h-40 bg-gray-200 rounded mb-4"></div>
                            <h2 className="text-lg font-semibold mb-2">Sample Product {item}</h2>
                            <p className="text-gray-600 mb-2">$ {(item * 10).toFixed(2)}</p>
                            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                View Details
                            </button>
                        </div>
                    ))}
                </section>
            </main>
          <Footer />
          
        </div>
    );
}
