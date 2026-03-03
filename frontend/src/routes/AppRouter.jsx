import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from "../components/ProtectedRoute";
// Pages
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
import Wishlist from '../pages/Wishlist';
import Orders from '../pages/Orders';
import OrderDetails from '../pages/OrderDetails';
import PaymentSuccess from "../pages/PaymentSuccess";
import SellerShopPage from '../pages/SellerShopPage.jsx';

// Error pages
import NotFoundPage from '../pages/NotFoundPage';
import ServerErrorPage from '../pages/ServerErrorPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';

// Listing Forms
import BookListingForm from '../components/BookListingForm';
import AntiqueJewelryListingForm from '../components/AntiqueJewelryListingForm';
import PotteryListingForm from '../components/PotteryListingForm';
import HomeDecorListingForm from '../components/HomeDecorListingForm';
import FlowersHandcraftsListingForm from '../components/FlowersHandcraftsListingForm';

function AppRouter() {
  return (
    <Routes>
      {/* General Routes */}
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
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Seller Routes */}
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

      {/* Products */}
      <Route path="/products" element={<Products />} />
      <Route path="/product/:id" element={<ProductDetails />} />
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

      {/* Category & Products */}
      <Route path="/category/:id" element={<CategorySubcategories />} />
      <Route path="/seller/product/:productId" element={<ProductDetail />} />
      <Route path="/products/*" element={<ProductPage />} />

      {/* Listing Forms */}
      <Route path="/book-listing-form/:id" element={<BookListingForm />} />
      <Route path="/antique-jewelry-listing-form/:id" element={<AntiqueJewelryListingForm />} />
      <Route path="/pottery-listing-form/:id" element={<PotteryListingForm />} />
      <Route path="/home-decor-listing-form/:id" element={<HomeDecorListingForm />} />
      <Route path="/flowers-handcrafts-listing-form/:id" element={<FlowersHandcraftsListingForm />} />

      {/* Error pages */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/500" element={<ServerErrorPage />} />

      {/* 404 catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
export default AppRouter;
