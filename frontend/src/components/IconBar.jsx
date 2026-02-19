import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

const IconBar = ({ parentSlug }) => {
  const [categories, setCategories] = useState([]);
  const [activeSlug, setActiveSlug] = useState(null);
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  useEffect(() => {
    setCategories([]);

    const fetchDirectChildren = async () => {
      if (!parentSlug) { setCategories([]); return; }
      try {
        const res = await fetch("/Category");
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();

        const effectiveSlug = parentSlug;
        let currentCategory = data.find((cat) => cat.slug === effectiveSlug);

        if (!currentCategory && effectiveSlug && effectiveSlug.includes("/")) {
          const lastSlugPart = effectiveSlug.split("/").pop();
          currentCategory = data.find((cat) => cat.slug.endsWith(lastSlugPart));
        }

        if (!currentCategory) { setCategories([]); return; }

        let children = data.filter((cat) => cat.parent_id === currentCategory._id);

        if (children.length === 0) {
          const base = currentCategory.slug;
          const baseDepth = base.split("/").length;
          children = data.filter((cat) => {
            if (!cat.slug || cat.slug === base) return false;
            if (!cat.slug.startsWith(base + "/")) return false;
            return cat.slug.split("/").length === baseDepth + 1;
          });
        }

        // ── Fallback: leaf category — show siblings so the strip stays visible ──
        if (children.length === 0 && currentCategory.parent_id) {
          const siblings = data.filter(
            (cat) => cat.parent_id === currentCategory.parent_id
          );
          if (siblings.length > 0) {
            setActiveSlug(currentCategory.slug);
            setCategories(siblings);
            return;
          }
        }

        setCategories(children);
      } catch (err) {
        console.error("Error fetching IconBar categories:", err);
      }
    };

    fetchDirectChildren();
  }, [parentSlug]);

  const handleClick = (childSlug) => {
    setActiveSlug(childSlug);
    navigate(`/products/${childSlug}`);
  };

  const scrollLeft = () => scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
  const scrollRight = () => scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });

  if (categories.length === 0) return null;

  return (
    <div className="relative w-full bg-white border-b border-gray-100 shadow-sm py-4">
      {/* Left Arrow */}
      <button
        onClick={scrollLeft}
        className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-gray-200 shadow-md rounded-full flex items-center justify-center z-10 hover:border-indigo-400 hover:shadow-indigo-100 transition-all duration-200"
      >
        <ChevronLeft size={18} className="text-gray-500" />
      </button>

      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 justify-start overflow-x-auto scroll-smooth hide-scrollbar px-12"
      >
        {categories.map((cat) => {
          const isActive = activeSlug === cat.slug;
          return (
            <div
              key={cat._id}
              onClick={() => handleClick(cat.slug)}
              className="flex flex-col items-center cursor-pointer group flex-shrink-0"
            >
              {/* Icon container */}
              <div
                className={`w-16 h-16 flex items-center justify-center rounded-2xl border-2 transition-all duration-300 ${isActive
                  ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100"
                  : "border-gray-100 bg-gray-50 group-hover:border-indigo-300 group-hover:bg-indigo-50 group-hover:shadow-md group-hover:shadow-indigo-100"
                  }`}
              >
                {cat.image ? (
                  <img
                    src={
                      (cat.image || "").startsWith("http")
                        ? cat.image
                        : `/${cat.image.replace(/\\/g, "/")}`
                    }
                    alt={cat.category_name}
                    className="w-9 h-9 object-contain"
                  />
                ) : (
                  <div className="text-2xl">📦</div>
                )}
              </div>

              {/* Label */}
              <p
                className={`mt-2 text-xs font-semibold text-center transition-colors duration-200 max-w-[72px] leading-tight ${isActive
                  ? "text-indigo-600"
                  : "text-gray-500 group-hover:text-indigo-500"
                  }`}
              >
                {cat.category_name}
              </p>

              {/* Active indicator dot */}
              <div
                className={`mt-1.5 w-1.5 h-1.5 rounded-full transition-all duration-200 ${isActive ? "bg-indigo-500 scale-100" : "bg-transparent scale-0"
                  }`}
              />
            </div>
          );
        })}
      </div>

      {/* Right Arrow */}
      <button
        onClick={scrollRight}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-gray-200 shadow-md rounded-full flex items-center justify-center z-10 hover:border-indigo-400 hover:shadow-indigo-100 transition-all duration-200"
      >
        <ChevronRight size={18} className="text-gray-500" />
      </button>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default IconBar;