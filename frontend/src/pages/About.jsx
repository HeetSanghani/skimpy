import React from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import CateNavbar from "../components/CategoryNavbar";
import Footer from "../components/Footer";
import heroImage from "../assets/skimpy-hero.png";

export default function About() {
  return (
    <div className="min-h-screen bg-white text-black font-inter">
      {/* Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap');

        .font-sora { font-family: 'Sora', sans-serif; }

        .lux-card {
          background: white;
          border-radius: 28px;
          padding: clamp(20px, 5vw, 48px);
          box-shadow: 0 18px 28px rgba(0, 0, 0, 0.15);
          transition: transform 240ms ease, box-shadow 240ms ease;
        }
        .lux-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 26px 50px rgba(0, 0, 0, 0.18);
        }

        .btn-lux {
          border: 1px solid black;
          padding: 12px 32px;
          border-radius: 999px;
          font-weight: 500;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .btn-lux:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
        }
      `}</style>

      <Navbar />
      <CateNavbar />

      {/* HERO SECTION */}
      <section className="relative w-full min-h-[60vh] flex items-center justify-center overflow-hidden py-16">
        {/* Soft spotlight */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.06),transparent)]"></div>

        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center z-10">
          {/* TEXT SIDE */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-4xl sm:text-6xl font-sora font-extrabold leading-tight tracking-tight">
              Skimpy —
              <span className="block mt-2">Handmade. Thrifted. Futuristic.</span>
            </h1>

            <p className="mt-6 text-lg text-neutral-700 max-w-md leading-relaxed">
              A next-generation marketplace uniting creators, thrifters, collectors, and innovators — all under one minimal, premium, modern platform.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a href="/sell" className="btn-lux bg-black text-white">
                Start Selling
              </a>
              <a href="/products" className="btn-lux bg-white text-black">
                Explore Listings
              </a>
            </div>
          </motion.div>

          {/* IMAGE SIDE */}
          <motion.div
            className="flex justify-center lg:justify-end"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="lux-card p-0 overflow-hidden rounded-[28px]">
              <img
                src={heroImage}
                alt="Skimpy Marketplace"
                className="w-full h-[380px] object-cover rounded-[28px]"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* MISSION SECTION */}
      <main className="max-w-6xl mx-auto px-6 py-20">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-12"
        >
          <div className="md:col-span-2 lux-card">
            <h2 className="text-3xl font-sora font-semibold">Our Mission</h2>
            <p className="text-neutral-700 leading-relaxed text-lg mt-4">
              Skimpy empowers independent creators and thrift enthusiasts with a next-gen
              platform that combines modern technology with authenticity, craftsmanship, and community.
            </p>

            <h3 className="mt-8 text-xl font-sora font-semibold">How Skimpy Works</h3>
            <ul className="mt-4 space-y-3 text-neutral-700 text-base">
              <li>• Fast, lightweight, mobile-first UI for easy posting</li>
              <li>• Deep structured categories for intelligent browsing</li>
              <li>• Real-time secure buyer–seller messaging</li>
              <li>• Powerful authentication and role-based access</li>
            </ul>
          </div>

          <aside className="flex flex-col gap-12">
            <div className="lux-card">
              <h4 className="text-lg font-sora font-semibold">Built for Creators</h4>
              <p className="mt-2 text-neutral-700 text-sm">
                Multi-image uploads, intuitive listing flow, and accurate analytics.
              </p>
            </div>

            <div className="lux-card">
              <h4 className="text-lg font-sora font-semibold">Secure & Scalable</h4>
              <p className="mt-2 text-neutral-700 text-sm">
                Modern authentication, rate-limiting, scalable APIs, enterprise-ready backend.
              </p>
            </div>
          </aside>
        </motion.section>

        {/* STATS SECTION */}
        <section className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-10">
          <Stat label="Listings" value="12,400+" />
          <Stat label="Sellers" value="4,800+" />
          <Stat label="Categories" value="320+" />
        </section>

        {/* CTA */}
        <motion.section
          className="mt-20 lux-card text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h3 className="text-3xl font-sora font-semibold">Ready to list your first item?</h3>
          <p className="mt-4 text-neutral-700 text-lg">
            Join a fast-growing community of sellers, creators and collectors.
          </p>

          <div className="mt-8 flex justify-center">
            <a
              href="/sell"
              className="btn-lux bg-black text-white text-lg"
            >
              Create Listing
            </a>
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <motion.div
      className="lux-card text-center py-10"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-sm text-neutral-600">{label}</div>
      <div className="mt-3 text-4xl font-extrabold text-neutral-900">{value}</div>
    </motion.div>
  );
}
