
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CategoryNavbar = () => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // Fetch & build category tree
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/Category");
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();

        const map = {};
        data.forEach((cat) => {
          map[cat._id] = { ...cat, subcategories: [] };
        });

        const tree = [];
        data.forEach((cat) => {
          if (cat.parent_id && map[cat.parent_id]) {
            map[cat.parent_id].subcategories.push(map[cat._id]);
          } else {
            tree.push(map[cat._id]);
          }
        });

        setCategories(tree);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleNavigate = (slug) => {
    navigate(`/products/${slug}`);
  };

  // Flatten level-2 categories for horizontal pills
  const level2Categories = categories.flatMap((cat) => cat.subcategories ?? []);

  return (
    <nav className="glass-nav top-[72px] z-40 py-2">
      <ul className="flex justify-center items-center gap-3 px-6 overflow-x-auto scrollbar-hide py-2">

        {/* "All Categories" — navigates to /products */}
        <li className="flex-shrink-0">
          <button
            onClick={() => navigate("/products")}
            className="px-5 py-2.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 font-sora hover:scale-105 bg-gray-100/80 text-gray-800 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:text-white hover:shadow-lg"
          >
            All Categories
          </button>
        </li>

        {/* Level-2 category pills */}
        {level2Categories.map((level2) => (
          <li key={level2._id} className="flex-shrink-0">
            <button
              onClick={() => handleNavigate(level2.slug)}
              className="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 font-inter bg-white/50 border border-transparent hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:text-white hover:shadow-lg hover:-translate-y-0.5 hover:scale-105"
            >
              {level2.category_name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default CategoryNavbar;
