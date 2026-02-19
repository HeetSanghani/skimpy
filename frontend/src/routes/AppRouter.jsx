import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from "../components/ProtectedRoute";
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
import Wishlist from '../pages/Wishlist';
import Orders from '../pages/Orders';
import OrderDetails from '../pages/OrderDetails';
import PaymentSuccess from "../pages/PaymentSuccess";

import ChatPage from '../pages/ChatPage.jsx';
import SellerShopPage from '../pages/SellerShopPage.jsx'


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
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="/my-cart" element={<Cart />} />
      <Route
        path="/wishlist"
        element={
          <ProtectedRoute>
            <Wishlist />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      {/* :small_blue_diamond: Seller and Product Management */}
      <Route
        path="/seller/dashboard"
        element={
          <ProtectedRoute>
            <SellerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sell"
        element={
          <ProtectedRoute>
            <Sell />
          </ProtectedRoute>
        }
      />


      <Route path="/Products" element={<Products />} />
      <Route path="/product/:id" element={<ProductDetails />} />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-orders"
        element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-orders/:orderId"
        element={
          <ProtectedRoute>
            <OrderDetails />
          </ProtectedRoute>
        }
      />

      <Route path="/order-confirmation" element={<PaymentSuccess />} />
      <Route path="/seller/:sellerId" element={<SellerShopPage />} />
      <Route
        path="/chat/:sellerId"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />


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









