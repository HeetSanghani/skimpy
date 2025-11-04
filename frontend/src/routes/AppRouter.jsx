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
import CategorySubcategories from '../pages/CategorySubcategories';
import BookListingForm from '../components/BookListingForm';
import AntiqueJewelryListingForm from '../components/AntiqueJewelryListingForm';
import SellerDashboard from '../pages/SellerDashboard';
import Sell from '../pages/Sell';
import ProductDetail from '../pages/ProductDetail';

// <<< IMPORT NEW FORMS HERE >>>
import PotteryListingForm from '../components/PotteryListingForm'; 
import HomeDecorListingForm from '../components/HomeDecorListingForm';
import FlowersHandcraftsListingForm from '../components/FlowersHandcraftsListingForm';


function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            {/* New subcategory route */}
            <Route path="/category/:id" element={<CategorySubcategories />} />
            
            <Route path="/Cart" element={<Cart />} />
            <Route path="/About" element={<About />} />
            <Route path="/Contact" element={<Contact />} />
            <Route path="/Profile" element={<Profile />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/seller/dashboard" element={<SellerDashboard />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Dedicated Routes for specialized forms */}
            <Route path="/book-listing-form/:id" element={<BookListingForm />} />
            <Route path="/antique-jewelry-listing-form/:id" element={<AntiqueJewelryListingForm />} />
            
            {/* <<< NEW ROUTES ADDED >>> */}
            <Route path="/pottery-listing-form/:id" element={<PotteryListingForm />} />
            <Route path="/home-decor-listing-form/:id" element={<HomeDecorListingForm />} />
            <Route path="/flowers-handcrafts-listing-form/:id" element={<FlowersHandcraftsListingForm />} />
            <Route path="/product/:productId" element={<ProductDetail />} />

           

        </Routes>
    );
}

export default AppRouter;