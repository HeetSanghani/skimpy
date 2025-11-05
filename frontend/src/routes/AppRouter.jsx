// import React from 'react';
// import { Routes, Route } from 'react-router-dom';
// import Home from '../pages/Home';

// import Profile from '../pages/Profile';
// import About from '../pages/About';
// import Contact from '../pages/Contact';
// import Login from '../pages/Login';
// import Register from '../pages/Register';
// import Cart from '../pages/Cart';
// import ResetPassword from "../pages/ResetPassword";
// import ForgotPassword from '../pages/ForgotPassword';

// // 🔹 New product pages
// import Products from '../pages/Products';
// import ProductDetails from '../pages/ProductDetails';
// import Messages from '../pages/Messages';

// function AppRouter() {
//   return (
//     <Routes>
//       {/* General routes */}
//       <Route path="/" element={<Home />} />
//       <Route path="/About" element={<About />} />
//       <Route path="/Contact" element={<Contact />} />
//       <Route path="/Profile" element={<Profile />} />
//       <Route path="/Cart" element={<Cart />} />
//       <Route path="/login" element={<Login />} />
//       <Route path="/register" element={<Register />} />
//       <Route path="/reset-password" element={<ResetPassword />} />
//       <Route path="/forgot-password" element={<ForgotPassword />} />

//       {/* ✅ Product-related routes */}
//       <Route path="/Products" element={<Products />} />
//      <Route path="/product/:id" element={<ProductDetails />} />
//       <Route path="/messages" element={<Messages />} />

//       {/* Optional: fallback route */}
//       <Route path="*" element={<h1 className="text-center mt-10 text-xl text-gray-600">404 Page Not Found</h1>} />
//     </Routes>
//   );
// import ForgotPassword from '../pages/ForgotPassword';   
// import CategorySubcategories from '../pages/CategorySubcategories';
// import BookListingForm from '../components/BookListingForm';
// import AntiqueJewelryListingForm from '../components/AntiqueJewelryListingForm';
// import SellerDashboard from '../pages/SellerDashboard';
// import Sell from '../pages/Sell';
// import ProductDetail from '../pages/ProductDetail';

// // <<< IMPORT NEW FORMS HERE >>>
// import PotteryListingForm from '../components/PotteryListingForm'; 
// import HomeDecorListingForm from '../components/HomeDecorListingForm';
// import FlowersHandcraftsListingForm from '../components/FlowersHandcraftsListingForm';   
// import ProductPage from "../pages/ProductPage";

// function AppRouter() {
//     return (
//         <Routes>
//             <Route path="/" element={<Home />} />
//             {/* New subcategory route */}
//             <Route path="/category/:id" element={<CategorySubcategories />} />
//             
//             <Route path="/Cart" element={<Cart />} />
//             <Route path="/About" element={<About />} />
//             <Route path="/Contact" element={<Contact />} />
//             <Route path="/Profile" element={<Profile />} />
//             <Route path="/profile" element={<Profile />} />
//             <Route path="/seller/dashboard" element={<SellerDashboard />} />
//             <Route path="/sell" element={<Sell />} />
// s           <Route path="/login" element={<Login />} />
//             <Route path="/register" element={<Register />} />
//             <Route path="/reset-password" element={<ResetPassword />} />
//             <Route path="/forgot-password" element={<ForgotPassword />} />
//             
//             {/* Dedicated Routes for specialized forms */}
//             <Route path="/book-listing-form/:id" element={<BookListingForm />} />
//             <Route path="/antique-jewelry-listing-form/:id" element={<AntiqueJewelryListingForm />} />
//             
//             {/* <<< NEW ROUTES ADDED >>> */}
// s           <Route path="/pottery-listing-form/:id" element={<PotteryListingForm />} />
//             <Route path="/home-decor-listing-form/:id" element={<HomeDecorListingForm />} />
//             <Route path="/flowers-handcrafts-listing-form/:id" element={<FlowersHandcraftsListingForm />} />
//             <Route path="/product/:productId" element={<ProductDetail />} />
//             
//             {/* ✅ THIS IS THE CORRECTED ROUTE */}
//             <Route path="/products/*" element={<ProductPage />} />

//         </Routes>
//     );
// }

// export default AppRouter;














import React from 'react';
import { Routes, Route } from 'react-router-dom';
// :white_tick: Pages
import Home from '../pages/Home';
import About from '../pages/About';
import Contact from '../pages/Contact';
import Profile from '../pages/Profile';
import Cart from '../pages/Cart';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ResetPassword from '../pages/ResetPassword';
import ForgotPassword from '../pages/ForgotPassword';
import CategorySubcategories from '../pages/CategorySubcategories';
import SellerDashboard from '../pages/SellerDashboard';
import Sell from '../pages/Sell';
import ProductDetail from '../pages/ProductDetail';
import ProductPage from '../pages/ProductPage';



import Products from '../pages/Products';
import ProductDetails from '../pages/ProductDetails';
import Messages from '../pages/Messages';



// :white_tick: Components (Forms)
import BookListingForm from '../components/BookListingForm';
import AntiqueJewelryListingForm from '../components/AntiqueJewelryListingForm';
import PotteryListingForm from '../components/PotteryListingForm';
import HomeDecorListingForm from '../components/HomeDecorListingForm';
import FlowersHandcraftsListingForm from '../components/FlowersHandcraftsListingForm';
function AppRouter() {
  return (
    <Routes>
      {/* :small_blue_diamond: General Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      {/* :small_blue_diamond: Seller and Product Management */}
      <Route path="/seller/dashboard" element={<SellerDashboard />} />
      <Route path="/sell" element={<Sell />} />


    <Route path="/Products" element={<Products />} />
    <Route path="/product/:id" element={<ProductDetails />} />
    <Route path="/messages" element={<Messages />} />



      {/* :small_blue_diamond: Category & Products */}
      <Route path="/category/:id" element={<CategorySubcategories />} />
      <Route path="/seller/product/:productId" element={<ProductDetail />} />
      <Route path="/products/*" element={<ProductPage />} />
      {/* :small_blue_diamond: Listing Forms */}
      <Route path="/book-listing-form/:id" element={<BookListingForm />} />
      <Route path="/antique-jewelry-listing-form/:id" element={<AntiqueJewelryListingForm />} />
      <Route path="/pottery-listing-form/:id" element={<PotteryListingForm />} />
      <Route path="/home-decor-listing-form/:id" element={<HomeDecorListingForm />} />
      <Route path="/flowers-handcrafts-listing-form/:id" element={<FlowersHandcraftsListingForm />} />
      {/* :small_blue_diamond: 404 Fallback */}




    




      <Route
        path="*"
        element={
          <h1 className="text-center mt-10 text-xl text-gray-600">
            404 Page Not Found
          </h1>
        }
      />
    </Routes>
  );
}
export default AppRouter;









