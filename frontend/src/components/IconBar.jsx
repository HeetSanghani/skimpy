

import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react"; 

const IconBar = () => {
  const { slug } = useParams();
  const [categories, setCategories] = useState([]);
  const [activeSlug, setActiveSlug] = useState(null);
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // Helper: Build levels
  const buildLevels = (categories) => {
    const map = {};
    categories.forEach((cat) => (map[cat._id] = { ...cat, level: 1 }));

    categories.forEach((cat) => {
      if (cat.parent_id && map[cat.parent_id]) {
        map[cat._id].level = map[cat.parent_id].level + 1;
      }
    });

    return Object.values(map);
  };

  useEffect(() => {
    const fetchLevel3Categories = async () => {
      try {
        const res = await fetch("http://localhost:8000/Category");
        if (!res.ok) throw new Error("Failed to fetch categories");

        const data = await res.json();
        const leveled = buildLevels(data);

        let currentCategory = leveled.find((cat) => cat.slug === slug);
        if (!currentCategory && slug.includes("/")) {
          const slugParts = slug.split("/");
          const lastSlugPart = slugParts[slugParts.length - 1];
          currentCategory = leveled.find((cat) => cat.slug.endsWith(lastSlugPart));
        }

        if (!currentCategory) {
          setCategories([]);
          return;
        }

        let level3Categories = [];

        if (currentCategory.level === 1) {
          const level2Children = leveled.filter(
            (cat) => cat.parent_id === currentCategory._id && cat.level === 2
          );
          level2Children.forEach((level2Cat) => {
            const level3Children = leveled.filter(
              (cat) => cat.parent_id === level2Cat._id && cat.level === 3
            );
            level3Categories.push(...level3Children);
          });
          }else if (currentCategory.level === 2) {
            level3Categories = leveled.filter(
                (cat) => cat.parent_id === currentCategory._id && cat.level === 3
            );
        }
        
        setCategories(level3Categories);
      } catch (err) {
        console.error("Error fetching level 3 categories:", err);
      }
    };

    if (slug) fetchLevel3Categories();
  }, [slug]);

  const handleClick = (childSlug) => {
    setActiveSlug(childSlug);
    navigate(`/products/${childSlug}`);
  };

  // 🔹 Scroll handlers
  const scrollLeft = () => {
    scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };

  if (categories.length === 0) return null;

  return (
    <div className="relative w-full bg-white border-b shadow-sm py-5">
      {/* Left Arrow */}
      <button
        onClick={scrollLeft}
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-white shadow-md rounded-full p-2 z-10 hover:bg-gray-100"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-10 justify-start overflow-x-auto scroll-smooth hide-scrollbar px-10"
      >
        {categories.map((cat) => (
          <div
            key={cat._id}
            onClick={() => handleClick(cat.slug)}
            className="flex flex-col items-center cursor-pointer group"
          >
            <div
              className={`w-20 h-20 flex items-center justify-center rounded-full border transition-all ${
                activeSlug === cat.slug
                  ? "bg-gray-100 border-gray-400"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
            >
              {cat.image ? (
                <img
                  src={`http://localhost:8000/${cat.image.replace(/\\/g, "/")}`}
                  alt={cat.category_name}
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <div className="text-3xl text-gray-400">📦</div>
              )}
            </div>
            <p
              className={`mt-2 text-sm font-medium text-center ${
                activeSlug === cat.slug
                  ? "text-black underline"
                  : "text-gray-700 group-hover:text-black"
              }`}
            >
              {cat.category_name}
            </p>
          </div>
        ))}
      </div>

      {/* Right Arrow */}
      <button
        onClick={scrollRight}
        className="absolute right-0 top-1/2 -translate-y-1/2 bg-white shadow-md rounded-full p-2 z-10 hover:bg-gray-100"
      >
        <ChevronRight size={24} />
      </button>

      {/* Hide Scrollbar */}
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
    </div>
  );
};

export default IconBar;

