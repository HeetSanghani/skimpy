import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { fetchProfileThunk } from "../features/auth/authSlice";
import ProfileCompletionModal from "../components/ProfileCompletionModal";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import toast from 'react-hot-toast';
import { MessageCircle, ShoppingBag, Store, MapPin, Calendar, Star, Package } from "lucide-react";
import ProductCardDark from "../components/ProductCardDark";

const BASE_URL = "";

const DEFAULT_IMAGE = "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22200%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20200%20200%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_1%20text%20%7B%20fill%3A%23666%3Bfont-weight%3Anormal%3Bfont-family%3AHelvetica%2C%20monospace%3Bfont-size%3A14pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_1%22%3E%3Crect%20width%3D%22200%22%20height%3D%22200%22%20fill%3D%22%231a1a2e%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%2260%22%20y%3D%22105%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E";

function SellerShopPage() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("products");
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth || {});

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [missingFields, setMissingFields] = useState([]);

  // Fetch profile checks
  useEffect(() => {
    if (token && (!user || !user.email)) {
      dispatch(fetchProfileThunk());
    }
  }, [dispatch, token, user]);

  const validateProfile = () => {
    if (!user) return ["Log in to continue"];
    const missing = [];
    if (!user.phone) missing.push("Mobile Number");
    if (!user.DOB) missing.push("Date of Birth");
    if (!user.gender) missing.push("Gender");
    if (!user.has_delivery_address) missing.push("At least one Delivery Address");
    if (!user.avatar) missing.push("Profile Avatar");
    return missing;
  };

  const handleMessageSeller = () => {
    if (!token) {
      toast.error("Please log in to message the seller.");
      navigate("/login");
      return;
    }
    const missing = validateProfile();
    if (missing.length > 0) {
      toast.error(`Please complete your profile: ${missing.join(", ")}`);
      setMissingFields(missing);
      setShowProfileModal(true);
      return;
    }
    navigate(`/chat/${sellerId}`);
  };

  // Fetch Seller details and their products
  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        const sellerRes = await axios.get(`${BASE_URL}/Vendor?vendor_id=${sellerId}`);
        setSeller(sellerRes.data);

        const productRes = await axios.get(`${BASE_URL}/Product/by-vendor/${sellerId}`);
        setProducts(Array.isArray(productRes.data) ? productRes.data : []);
      } catch (err) {
        console.error("Error fetching seller or products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSellerData();
  }, [sellerId]);

  const normalizeImage = (img) => {
    if (!img) return DEFAULT_IMAGE;
    if (typeof img !== "string") return DEFAULT_IMAGE;
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    if (img.startsWith("data:image")) return img;
    return `${BASE_URL}${img.startsWith("/") ? img : `/${img}`}`;
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white font-inter">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-gray-400">Loading Shop...</p>
          </div>
        </div>
        <Footer />
      </div>
    );

  if (!seller)
    return (
      <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white font-inter">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Store className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h2 className="text-xl font-bold mb-2">Seller Not Found</h2>
            <p className="text-gray-400 mb-6">This shop is unavailable or does not exist.</p>
            <button onClick={() => navigate("/")} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
              Back to Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-inter text-gray-200">
      <Navbar />

      {/* ===== Banner Section ===== */}
      <div className="w-full h-48 md:h-72 relative">
        {seller.banner ? (
          <img src={normalizeImage(seller.banner)} alt="banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-900 via-[#1a1a2e] to-indigo-950 flex items-center justify-center text-white/20">
            <Store className="w-24 h-24 opacity-20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-90" />
      </div>

      {/* ===== Seller Header ===== */}
      <div className="w-full bg-[#0a0a0a] border-b border-white/10 shadow-lg shadow-indigo-500/5 px-4 pb-8 -mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-75 blur group-hover:opacity-100 transition duration-500"></div>
              <img
                src={normalizeImage(seller.image || seller.profile_image)}
                alt={seller.shop_name}
                className="relative w-28 h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-[#0a0a0a] bg-[#1a1a2e]"
              />
            </div>

            <div className="flex-grow text-center md:text-left pb-2">
              <h1 className="text-2xl md:text-4xl font-extrabold text-white font-sora tracking-tight mb-2">
                {seller.shop_name}
              </h1>
              <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto md:mx-0 line-clamp-2 mb-4">
                {seller.description || "Welcome to my shop! Check out my latest products and deals."}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                  <ShoppingBag className="w-4 h-4 text-indigo-400" />
                  <span>{products.length} Products</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>4.8 Rating</span>
                </div>
                {/* Placeholder for location/joined if available */}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>Joined 2024</span>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 pb-2 w-full md:w-auto">
              <button
                onClick={handleMessageSeller}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
              >
                <MessageCircle className="w-5 h-5" />
                Message Seller
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Tabs ===== */}
      <div className="w-full bg-[#0a0a0a] border-b border-white/10 sticky top-[72px] z-20 z-[40]"> {/* Adjusted z-index and top if Navbar is sticky */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {["products", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 text-sm font-semibold border-b-2 transition-colors duration-200 ${activeTab === tab
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-white hover:border-white/20"
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ===== Content ===== */}
      <div className="flex-grow bg-[#0a0a0a] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {activeTab === "products" && (
            <>
              {products.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-700" />
                  <p className="text-gray-400 text-lg">No products found for this seller.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {products.map((product) => (
                    <ProductCardDark key={product._id} product={product} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "reviews" && (
            <div className="max-w-3xl mx-auto text-center py-16 bg-white/5 rounded-2xl border border-white/10">
              <Star className="w-12 h-12 mx-auto mb-4 text-gray-700" />
              <h2 className="text-xl font-semibold text-white mb-2">Customer Reviews</h2>
              <p className="text-gray-400">Reviews coming soon. Stay tuned!</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        missingFields={missingFields}
      />
    </div>
  );
}

export default SellerShopPage;
