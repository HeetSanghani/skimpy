
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api/baseUrl";

const CategoryNavbar = () => {
  const [categorySlugByKey, setCategorySlugByKey] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/Category`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();

        const norm = (s) => (typeof s === "string" ? s.trim().toLowerCase() : "");
        const findSlug = (keywords) => {
          const kw = keywords.map(norm);
          const hit = (data || []).find((c) => {
            const name = norm(c?.category_name || c?.name);
            const slug = norm(c?.slug);
            return kw.some((k) => name.includes(k) || slug.includes(k));
          });
          return hit?.slug || "";
        };

        setCategorySlugByKey({
          clothes: findSlug(["clothes", "fashion", "apparel", "wear"]),
          books: findSlug(["books", "book", "novel", "comics"]),
          antique: findSlug(["antique", "jewelry", "jewellery", "vintage"]),
          pottery: findSlug(["pottery", "ceramic", "clay"]),
          home_decor: findSlug(["home decor", "homedecor", "wall art", "decor"]),
          flowers_handcrafts: findSlug(["flowers", "flower", "handcraft", "handicraft"]),
        });
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleNavigate = (slug) => {
    if (!slug) return;
    navigate(`/products/${slug}`);
  };

  const activeSlug = decodeURIComponent(
    (location.pathname.startsWith("/products/")
      ? location.pathname.replace("/products/", "")
      : "")
  );
  const isActive = (slug) => !!slug && activeSlug.startsWith(slug);

  const items = [
    { key: "clothes", label: "Clothes", slug: categorySlugByKey.clothes },
    { key: "books", label: "Books", slug: categorySlugByKey.books },
    { key: "antique", label: "Antique", slug: categorySlugByKey.antique },
    { key: "pottery", label: "Pottery", slug: categorySlugByKey.pottery },
    { key: "home_decor", label: "Home Decor", slug: categorySlugByKey.home_decor },
    { key: "flowers_handcrafts", label: "Flowers & Handcrafts", slug: categorySlugByKey.flowers_handcrafts },
  ];

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

        {items.map((it) => (
          <li key={it.key} className="flex-shrink-0">
            <button
              onClick={() => handleNavigate(it.slug)}
              disabled={!it.slug}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 font-inter border hover:-translate-y-0.5 hover:scale-105 ${
                isActive(it.slug)
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-lg"
                  : "bg-white/50 text-gray-800 border-transparent hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:text-white hover:shadow-lg"
              } ${!it.slug ? "opacity-50 cursor-not-allowed hover:scale-100 hover:-translate-y-0" : ""}`}
            >
              {it.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default CategoryNavbar;
