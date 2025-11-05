import React from 'react';
import { Routes, Route } from 'react-router-dom';

// 🔹 Existing pages
import Home from '../pages/Home';
import Profile from '../pages/Profile';
import About from '../pages/About';
import Contact from '../pages/Contact';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Cart from '../pages/Cart';
import ResetPassword from "../pages/ResetPassword";
import ForgotPassword from '../pages/ForgotPassword';

// 🔹 New product pages
import Products from '../pages/Products';
import ProductDetails from '../pages/ProductDetails';
import Messages from '../pages/Messages';

function AppRouter() {
  return (
    <Routes>
      {/* General routes */}
      <Route path="/" element={<Home />} />
      <Route path="/About" element={<About />} />
      <Route path="/Contact" element={<Contact />} />
      <Route path="/Profile" element={<Profile />} />
      <Route path="/Cart" element={<Cart />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* ✅ Product-related routes */}
      <Route path="/Products" element={<Products />} />
     <Route path="/product/:id" element={<ProductDetails />} />
      <Route path="/messages" element={<Messages />} />

      {/* Optional: fallback route */}
      <Route path="*" element={<h1 className="text-center mt-10 text-xl text-gray-600">404 Page Not Found</h1>} />
    </Routes>
  );
}

export default AppRouter;
