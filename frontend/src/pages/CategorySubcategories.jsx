import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { fetchSubcategories } from "../features/settings/settingsSlice";
import ProductListingForm from "../components/ProductListingForm";
// Note: Specialized forms are NOT imported here as they use dedicated routes defined in AppRouter.jsx

export default function CategorySubcategories() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { subcategories, loading } = useSelector((s) => s.settings);
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (id) dispatch(fetchSubcategories(id));
  }, [id, dispatch]);

  // --- Category Check Functions ---
  const BOOK_KEYWORDS = ["book", "books", "novel", "comics", "magazine", "textbook", "encyclopedia"];
  function isBookCategory(category) {
    const categoryName = (category?.category_name || category?.name || "").toLowerCase();
    const categorySlug = (category?.slug || "").toLowerCase();
    // Checks name OR checks if slug contains 'book'/'books' for subcategories (e.g., /books/fiction)
    return BOOK_KEYWORDS.some(keyword => categoryName.includes(keyword)) || categorySlug.includes("/books/") || categorySlug.includes("/book/");
  }

  const ANTIQUE_JEWELRY_KEYWORDS = [
      "antique", "jewelry", "jewellery", "vintage", "gold", "silver", "thrift", 
      "necklace", "ring", "earring", "bracelet", "pendan", "brooch", "bangle", 
      "trinket", "locket", "charm"
  ];
  
  function isAntiqueJewelryCategory(category) {
    const name = (category?.category_name || category?.name || "").toLowerCase();
    return ANTIQUE_JEWELRY_KEYWORDS.some(keyword => name.includes(keyword));
  }
  
  // *** POTTERY KEYWORDS UPDATED: ADDED 'PLATES' AND 'BOWLS' ***
  const POTTERY_KEYWORDS = ["pottery", "ceramic", "clay", "terracotta", "stoneware", "porcelain", "mugs", "vases", "crockery", "sculpture", "tile", "cup", "vase", "jar", "mug", "plates", "bowls"];
  function isPotteryCategory(category) {
    const name = (category?.category_name || category?.name || "").toLowerCase();
    return POTTERY_KEYWORDS.some(keyword => name.includes(keyword));
  }
  
  const HOME_DECOR_KEYWORDS = ["home decor", "homedecor", "wall art", "clock", "frames", "resin", "mirror"];
  function isHomeDecorCategory(category) {
    const name = (category?.category_name || category?.name || "").toLowerCase();
    return HOME_DECOR_KEYWORDS.some(keyword => name.includes(keyword));
  }
  
  const FLOWERS_HANDCRAFTS_KEYWORDS = ["flowers", "flower", "bouquet", "handcrafts", "mala", "artificial"];
  function isFlowersHandcraftsCategory(category) {
    const name = (category?.category_name || category?.name || "").toLowerCase();
    return FLOWERS_HANDCRAFTS_KEYWORDS.some(keyword => name.includes(keyword));
  }
  // ---------------------------

  const handleCategoryClick = (category) => {
    const isBook = isBookCategory(category);
    const isAntique = isAntiqueJewelryCategory(category);
    const isPottery = isPotteryCategory(category);
    const isHomeDecor = isHomeDecorCategory(category);
    const isFlowersHandcrafts = isFlowersHandcraftsCategory(category);
    
    const children = subcategories.filter(sub => sub.parent_id === category._id || sub.parent_id === category.id);
    const categoryId = category._id || category.id;

    if (children.length > 0) {
      // Navigate to next level
      navigate(`/category/${categoryId}`);
    } else if (isPottery) { 
      navigate(`/pottery-listing-form/${categoryId}`);
    } else if (isBook) {
      navigate(`/book-listing-form/${categoryId}`);
    } else if (isAntique) {
      navigate(`/antique-jewelry-listing-form/${categoryId}`);
    } else if (isHomeDecor) {
      navigate(`/home-decor-listing-form/${categoryId}`);
    } else if (isFlowersHandcrafts) {
      navigate(`/flowers-handcrafts-listing-form/${categoryId}`);
    } else {
      // Generic form for all others
      setSelectedCategory(category);
      setShowProductForm(true);
    }
  };

  if (showProductForm && selectedCategory) {
    return (
      <>
        <Navbar />
        <ProductListingForm
          category={selectedCategory}
          onBack={() => setShowProductForm(false)}
        />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">What do you want to sell ?</h1>
          <Link to="/Profile" className="text-sm underline">Back to Profile</Link>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (() => {
          const childrenOnly = (subcategories || []).filter((sub) => sub.parent_id === id);
          return childrenOnly.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {childrenOnly.map((sub) => (
              <div
                key={sub._id || sub.id}
                className="border rounded-lg p-4 flex flex-col items-center hover:shadow-lg transition cursor-pointer"
                onClick={() => handleCategoryClick(sub)}
              >
                <img
                  src={
                    sub.image
                      ? (sub.image.startsWith("http")
                          ? sub.image
                          : `http://127.0.0.1:8000/${sub.image}`)
                      : "https://via.placeholder.com/120x120?text=No+Image"
                  }
                  alt={sub.category_name}
                  className="w-28 h-28 object-cover rounded mb-3"
                />
                <p className="capitalize font-medium text-center">{sub.category_name}</p>
              </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No subcategories found.</p>
          );
        })()}
      </div>
      {/* <Footer /> */}
    </>
  );
}