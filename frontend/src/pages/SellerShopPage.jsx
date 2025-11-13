// // src/pages/SellerShopPage.jsx
// import React, { useState } from "react";
// import { useNavigate, useParams } from "react-router-dom";

// export default function SellerShopPage() {
//   const { sellerId } = useParams();
//   const navigate = useNavigate();

//   const seller = {
//     name: "Elegant Finds",
//     description: "Handcrafted treasures and timeless pieces curated for you.",
//     followers: 240,
//     products: 6,
//     image:
//       "https://i.pinimg.com/736x/14/86/86/148686b4a830e06d8089db5cb1e521f4.jpg",
//     banner: "", // leave empty to show default
//   };

//   const [activeTab, setActiveTab] = useState("products");

//   const demoProducts = [
//     { id: 1, name: "Vintage Lamp", price: 999, image: "https://via.placeholder.com/400x300" },
//     { id: 2, name: "Handmade Vase", price: 749, image: "https://via.placeholder.com/400x300" },
//     { id: 3, name: "Antique Clock", price: 1299, image: "https://via.placeholder.com/400x300" },
//     { id: 4, name: "Wooden Frame", price: 499, image: "https://via.placeholder.com/400x300" },
//   ];

//   const demoReviews = [
//     { id: 1, name: "Priya Patel", rating: 5, comment: "Beautiful craftsmanship! Worth every penny." },
//     { id: 2, name: "Aarav Shah", rating: 4, comment: "Good product and quick delivery." },
//   ];

//   return (
//     <div className="min-h-screen bg-[#F1F6F9] flex flex-col">
//       {/* ===== Banner Section ===== */}
//       <div className="w-full h-72 relative">
//         {seller.banner ? (
//           <img
//             src={seller.banner}
//             alt={`${seller.name} banner`}
//             className="w-full h-full object-cover"
//           />
//         ) : (
//           <div className="w-full h-full bg-gradient-to-r from-[#9BA4B4] to-[#394867] flex items-center justify-center text-white text-3xl font-semibold">
//             {seller.name} Shop
//           </div>
//         )}
//       </div>

//       {/* ===== Seller Info Header ===== */}
//       <div className="w-full bg-white border-b border-[#E8E8E8] shadow-sm px-6 md:px-20 py-6 flex flex-col md:flex-row items-center md:justify-between">
//         {/* Left Section */}
//         <div className="flex items-center space-x-5 mb-4 md:mb-0">
//           <img
//             src={seller.image}
//             alt={seller.name}
//             className="w-20 h-20 rounded-full object-cover border-4 border-[#9BA4B4] shadow-lg"
//           />
//           <div>
//             <h1 className="text-2xl font-bold text-[#14274E]">{seller.name}</h1>
//             <p className="text-[#394867] text-sm mt-1">{seller.description}</p>
//             <div className="flex items-center space-x-4 mt-2 text-sm text-[#9BA4B4]">
//               <p>👥 {seller.followers} followers</p>
//               <p>🛍 {seller.products} products</p>
//             </div>
//           </div>
//         </div>

//         {/* Right Section */}
//         <div className="flex space-x-3">
//           <button
//             onClick={() => alert("Followed!")}
//             className="px-5 py-2 bg-[#394867] text-white rounded-full hover:bg-[#14274E] shadow-md transition"
//           >
//             Follow
//           </button>
//           <button
//             onClick={() => navigate(`/chat/${sellerId || "seller456"}`)}
//             className="px-5 py-2 bg-[#9BA4B4] text-[#14274E] rounded-full hover:bg-[#4C7B8B] hover:text-white shadow-md transition"
//           >
//             Message
//           </button>
//         </div>
//       </div>

//       {/* ===== Navigation Tabs ===== */}
//       <div className="w-full bg-white border-b border-[#E8E8E8] shadow-sm sticky top-0 z-20">
//         <nav className="flex justify-center md:justify-start space-x-10 px-6 md:px-20 py-4">
//           {["products", "reviews"].map((tab) => (
//             <button
//               key={tab}
//               onClick={() => setActiveTab(tab)}
//               className={`pb-2 text-lg font-medium transition relative ${
//                 activeTab === tab
//                   ? "text-[#14274E] border-b-2 border-[#394867]"
//                   : "text-[#9BA4B4] hover:text-[#394867]"
//               }`}
//             >
//               {tab.charAt(0).toUpperCase() + tab.slice(1)}
//             </button>
//           ))}
//         </nav>
//       </div>

//       {/* ===== Content Area ===== */}
//       <div className="w-full flex-grow bg-[#F1F6F9]">
//         {activeTab === "products" && (
//           <div className="max-w-7xl mx-auto py-10 px-6 md:px-10">
//             <h2 className="text-xl font-semibold text-[#14274E] mb-6">Products</h2>
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
//               {demoProducts.map((p) => (
//                 <div
//                   key={p.id}
//                   className="bg-white border border-[#E8E8E8] rounded-2xl shadow-md hover:shadow-xl transition p-3 cursor-pointer"
//                 >
//                   <img
//                     src={p.image}
//                     alt={p.name}
//                     className="w-full h-56 object-cover rounded-lg"
//                   />
//                   <div className="p-3">
//                     <h3 className="text-[#14274E] font-semibold text-lg truncate">{p.name}</h3>
//                     <p className="text-[#394867] text-sm mt-1">₹{p.price}</p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {activeTab === "reviews" && (
//           <div className="max-w-5xl mx-auto py-10 px-6 md:px-10">
//             <h2 className="text-xl font-semibold text-[#14274E] mb-6">Customer Reviews</h2>
//             <div className="space-y-6">
//               {demoReviews.map((r) => (
//                 <div
//                   key={r.id}
//                   className="bg-white border border-[#E8E8E8] rounded-xl shadow-md p-4 hover:shadow-lg transition"
//                 >
//                   <div className="flex items-center justify-between mb-2">
//                     <h4 className="font-semibold text-[#14274E]">{r.name}</h4>
//                     <p className="text-[#394867] text-sm">⭐ {r.rating}/5</p>
//                   </div>
//                   <p className="text-[#495464] text-sm">{r.comment}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }





// src/pages/SellerShopPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";

const BASE_URL = "http://localhost:8000";

function SellerShopPage() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("products");
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Seller details and their products
  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        // Fetch seller info
        // const sellerRes = await axios.get(`${BASE_URL}/Vendor/${sellerId}`);
        const sellerRes = await axios.get(`${BASE_URL}/Vendor?vendor_id=${sellerId}`);
        setSeller(sellerRes.data);

        // Fetch products added by this seller
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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F6F9] text-[#394867]">
        Loading Seller Shop...
      </div>
    );

  if (!seller)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F6F9] text-[#394867]">
        Seller not found.
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F1F6F9] flex flex-col">
      {/* ===== Banner Section ===== */}
      <div className="w-full h-72 relative">
        {seller.banner ? (
          <img src={seller.banner} alt="banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#9BA4B4] to-[#394867] flex items-center justify-center text-white text-3xl font-semibold">
            {seller.shop_name || "Seller Shop"}
          </div>
        )}
      </div>

      {/* ===== Seller Header ===== */}
      <div className="w-full bg-white border-b border-[#E8E8E8] shadow-sm px-6 md:px-20 py-6 flex flex-col md:flex-row items-center md:justify-between">
        {/* Left */}
        <div className="flex items-center space-x-5 mb-4 md:mb-0">
          <img
            src={seller.profile_image || "https://via.placeholder.com/80"}
            alt={seller.name}
            className="w-20 h-20 rounded-full object-cover border-4 border-[#9BA4B4] shadow-lg"
          />
          <div>
            <h1 className="text-2xl font-bold text-[#14274E]">{seller.shop_name}</h1>
            <p className="text-[#394867] text-sm mt-1">{seller.description}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-[#9BA4B4]">
              <p>👥 {seller.followers || 0} followers</p>
              <p>🛍 {products.length} products</p>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex space-x-3">
          <button
            onClick={() => alert("Followed!")}
            className="px-5 py-2 bg-[#394867] text-white rounded-full hover:bg-[#14274E] shadow-md transition"
          >
            Follow
          </button>
          <button
            onClick={() => navigate(`/chat/${sellerId}`)}
            className="px-5 py-2 bg-[#9BA4B4] text-[#14274E] rounded-full hover:bg-[#4C7B8B] hover:text-white shadow-md transition"
          >
            Message
          </button>
        </div>
      </div>

      {/* ===== Tabs ===== */}
      <div className="w-full bg-white border-b border-[#E8E8E8] shadow-sm sticky top-0 z-20">
        <nav className="flex justify-center md:justify-start space-x-10 px-6 md:px-20 py-4">
          {["products", "reviews"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-lg font-medium transition ${
                activeTab === tab
                  ? "text-[#14274E] border-b-2 border-[#394867]"
                  : "text-[#9BA4B4] hover:text-[#394867]"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* ===== Content ===== */}
      <div className="w-full flex-grow bg-[#F1F6F9]">
        {activeTab === "products" && (
          <div className="max-w-7xl mx-auto py-10 px-6 md:px-10">
            {products.length === 0 ? (
              <p className="text-center text-[#394867] text-lg">
                No products found for this seller.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {products.map((product) => (
                  <Link
                    key={product._id}
                    to={`/product/${product._id}`}
                    className="bg-white border border-[#E8E8E8] rounded-2xl shadow-md hover:shadow-xl transition p-3 cursor-pointer"
                  >
                    <img
                      src={
                        Array.isArray(product.images) && product.images.length > 0
                          ? product.images[0]   // direct link from backend
                          : "https://via.placeholder.com/300"
                      }
                      alt={product.product_name}
                      className="w-full h-56 object-cover rounded-lg"
                    />

                    <div className="p-3">
                      <h3 className="text-[#14274E] font-semibold text-lg truncate">
                        {product.product_name}
                      </h3>
                      <p className="text-[#394867] text-sm mt-1">₹{product.price}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="max-w-5xl mx-auto py-10 px-6 md:px-10 text-center text-[#394867]">
            <h2 className="text-xl font-semibold mb-6">Customer Reviews</h2>
            <p>No reviews yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerShopPage;
