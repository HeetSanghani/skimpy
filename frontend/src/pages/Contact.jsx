import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import CateNavbar from "../components/CategoryNavbar";
import Footer from "../components/Footer";

import { sendContactMessage } from "../api/contactApi";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general",
  });

  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [catOpen, setCatOpen] = useState(false);

  const categories = [
    { value: "general", label: "General" },
    { value: "orders", label: "Orders & Shipping" },
    { value: "selling", label: "Selling" },
    { value: "payments", label: "Payments & Refunds" },
  ];

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your name";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Please enter a valid email";
    if (!form.message.trim() || form.message.trim().length < 10)
      e.message = "Message must be at least 10 characters";
    return e;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setSubmitError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setSending(true);

    try {
      await sendContactMessage(form);
      setSuccess(true);
      setForm({
        name: "",
        email: "",
        subject: "",
        message: "",
        category: "general",
      });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      setSubmitError("Failed to send message. Please try again later.");
    } finally {
      setSending(false);
    }
  }

  const container = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  };

  return (
    <div className="min-h-screen bg-white text-black antialiased font-inter">

      {/* Fonts + Custom Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@300;400;500;600&display=swap');

        .font-sora { font-family: 'Sora', sans-serif; }
        .font-inter { font-family: 'Inter', sans-serif; }

        .underline-grow {
          position: relative;
        }
        .underline-grow::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -4px;
          height: 2px;
          width: 0%;
          background: black;
          transition: width 200ms ease;
        }
        .underline-grow:hover::after,
        .underline-grow:focus-within::after {
          width: 100%;
        }

        .lux-card {
          background: white;
          border-radius: 28px;
          padding: clamp(20px, 5vw, 48px);
          box-shadow: 0 18px 28px rgba(0,0,0,0.15);
          transition: transform 240ms ease, box-shadow 240ms ease;
        }
        .lux-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 26px 50px rgba(0,0,0,0.18);
        }

        .btn-lux {
          border: 1px solid black;
          padding: 10px 28px;
          border-radius: 999px;
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .btn-lux:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 18px rgba(0,0,0,0.12);
        }

        .dropdown-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .dropdown-scroll::-webkit-scrollbar-thumb {
          background: black;
        }
      `}</style>

      <Navbar />
      <CateNavbar />

      {/* HERO -------------------- */}
      <header className="w-full flex items-center justify-center py-20 px-6">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl"
        >
          <h1 className="text-4xl md:text-5xl font-sora font-extrabold">
            Contact Support
          </h1>
          <p className="text-sm text-neutral-600 mt-3 font-inter">
            Need help with orders, selling, features, or partnerships?
            Our team responds within 24 hours.
          </p>
        </motion.div>
      </header>

      {/* MAIN GRID --------------------- */}
      <main className="max-w-6xl mx-auto px-6 pb-24">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-12"
        >

          {/* LEFT COLUMN -------------------------- */}
          <motion.aside variants={item} className="flex flex-col">

            {/* Reach Us Card */}
            <div className="lux-card">
              <h2 className="text-2xl font-sora font-semibold">Reach Us Directly</h2>
              <p className="text-sm text-neutral-600 mt-2 font-inter">
                For urgent matters, contact us here.
              </p>

              <div className="mt-6">
                <a
                  href="mailto:skimpy2022@gmail.com"
                  className="text-xl font-semibold relative inline-block group break-all"
                >
                  skimpy2022@gmail.com

                  {/* Underline animation */}
                  <span
                    className="absolute left-0 -bottom-1 w-0 h-[2px] bg-black transition-all duration-300 group-hover:w-full"
                  ></span>
                </a>

                <div className="text-xs text-neutral-600 mt-1">Primary Support</div>
              </div>

            </div>



            {/* Note Card */}
            <div className="lux-card mt-8">
              <div className="text-sm font-semibold">Note</div>
              <div className="text-xs text-neutral-600 mt-1">
                Include your order ID for faster routing.
              </div>
            </div>

            {/* FAQ Card */}
            <div className="lux-card mt-8">
              <h4 className="text-lg font-sora font-semibold">Quick FAQ</h4>

              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <div className="font-semibold">How long until I get a reply?</div>
                  <div className="text-neutral-600">Within 24 hours (Mon–Fri).</div>
                </div>

                <div>
                  <div className="font-semibold">Order issue?</div>
                  <div className="text-neutral-600">
                    Select “Orders” and include your order ID.
                  </div>
                </div>
              </div>
            </div>

          </motion.aside>

          {/* RIGHT COLUMN (FORM) ---------------------- */}
          <motion.section variants={item} className="lg:col-span-2">
            <div className="lux-card">

              {/* Heading */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-sora font-semibold">Send us a message</h3>
                  <p className="text-sm text-neutral-600 mt-1">
                    Our team will respond quickly.
                  </p>
                </div>
                <div className="hidden md:block text-xs px2 py-1 border border-black rounded-full px-3">
                  Support
                </div>
              </div>

              {/* FORM GRID */}
              <form onSubmit={handleSubmit} className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">

                {/* NAME */}
                <div className="underline-grow">
                  <label className="block text-xs mb-2">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full bg-transparent border-none p-0 py-3"
                  />
                </div>

                {/* EMAIL */}
                <div className="underline-grow">
                  <label className="block text-xs mb-2">Email</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@domain.com"
                    className="w-full bg-transparent border-none p-0 py-3"
                  />
                </div>

                {/* SUBJECT */}
                <div className="underline-grow md:col-span-2">
                  <label className="block text-xs mb-2">Subject</label>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Your subject"
                    className="w-full bg-transparent border-none p-0 py-3"
                  />
                </div>

                {/* CUSTOM CATEGORY DROPDOWN */}
                <div className="md:col-span-2 relative">
                  <label className="block text-xs mb-2">Category</label>

                  {/* Trigger */}
                  <div
                    onClick={() => setCatOpen(!catOpen)}
                    className="w-full border-b border-black py-3 cursor-pointer flex items-center justify-between"
                  >
                    <span className="capitalize font-inter">
                      {categories.find((c) => c.value === form.category)?.label}
                    </span>

                    <motion.div animate={{ rotate: catOpen ? 180 : 0 }}>
                      ▼
                    </motion.div>
                  </div>

                  {/* MENU */}
                  <AnimatePresence>
                    {catOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                        className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-black max-h-56 overflow-auto dropdown-scroll"
                        style={{ zIndex: 50 }}
                      >
                        {categories.map((cat) => (
                          <div
                            key={cat.value}
                            className={`
                              px-4 py-3 text-sm cursor-pointer
                              hover:bg-black hover:text-white
                              ${form.category === cat.value ? "bg-black text-white" : ""}
                            `}
                            onClick={() => {
                              setForm({ ...form, category: cat.value });
                              setCatOpen(false);
                            }}
                          >
                            {cat.label}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* MESSAGE */}
                <div className="underline-grow md:col-span-2">
                  <label className="block text-xs mb-2">Message</label>
                  <textarea
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Write here..."
                    className="w-full bg-transparent border-none p-0 py-3 resize-none"
                  />
                </div>

                {/* BUTTONS */}
                <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 mt-6">
                  <p className="text-xs text-neutral-600">
                    By sending, you agree to our <a className="underline">terms</a>.
                  </p>

                  <button type="submit" className="btn-lux">
                    {sending ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>

              {/* SUCCESS */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28 }}
                  className="mt-12 p-6 rounded-3xl border border-black bg-white"
                >
                  <div className="font-semibold">Message sent</div>
                  <div className="text-xs text-neutral-600">
                    Thank you — we’ll reply shortly.
                  </div>
                </motion.div>
              )}
              {/* SUBMIT ERROR */}
              {submitError && (
                <div className="mt-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100">
                  {submitError}
                </div>
              )}
            </div>
          </motion.section>

        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
