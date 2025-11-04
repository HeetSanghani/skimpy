import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';

import Profile from '../pages/Profile';
import About from '../pages/About';
import Contact from '../pages/Contact';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Cart from '../pages/Cart';
import ResetPassword from "../pages/ResetPassword";
import ForgotPassword from '../pages/ForgotPassword';      
import ProductPage from "../pages/ProductPage";

function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            
            <Route path="/Cart" element={<Cart />} />
            <Route path="/About" element={<About />} />
            <Route path="/Contact" element={<Contact />} />
            <Route path="/Profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/products/:slug/*" element={<ProductPage />} />
           
            
        </Routes>
    );
}

export default AppRouter;
