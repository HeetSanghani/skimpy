
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CategoryNavbar = () => {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  // ✅ Fetch & build category tree
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:8000/Category");
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
    navigate(`/products/${slug}`); //nevigate to other page   navigate(`/products/${cat._id}`);
    setActiveCategory(null);
    setShowAll(false);
  };

  const handleCategoryToggle = (id) => {
    setActiveCategory((prev) => (prev === id ? null : id));
  };

  // ✅ Recursive nested rendering
  const renderNestedLevels = (node, level = 2) => (
    <div key={node._id} className="ml-3 mb-1">
      <button
        onClick={() => handleNavigate(node.slug)}
        className={`block text-sm w-full text-left ${
          level === 2 ? "font-semibold" : "font-normal"
        } text-gray-600 hover:text-black transition-colors`}
      >
        {node.category_name}
      </button>

      {node.subcategories?.length > 0 && (
        <div className="ml-4 mt-1 border-l border-gray-200 pl-2">
          {node.subcategories.map((child) =>
            renderNestedLevels(child, level + 1)
          )}
        </div>
      )}
    </div>
  );

  // ✅ Quick links for level 2 (instead of level 3)
  const getLevel2Categories = (categories) => {
    const list = [];
    categories.forEach((a) => {
      a.subcategories?.forEach((b) => list.push(b));
    });
    return list;
  };
  const level2Categories = getLevel2Categories(categories);

  return (
    <nav className="bg-white text-black border-t border-b border-gray-200 shadow-sm top-[64px] z-50">
      <ul className="flex justify-start items-center space-x-8 py-3 px-6 text-sm font-semibold uppercase tracking-wide flex-wrap">
        {/* ✅ "All Categories" Button */}
        <li className="relative">
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className={`px-3 py-1 rounded transition-colors duration-200 ${
              showAll
                ? "text-black border-b-2 border-black"
                : "text-gray-700 hover:text-black"
            }`}
          >
            All Categories
          </button>

          {/* ✅ Dropdown */}
          {showAll && (
            <div className="absolute left-0 top-full mt-2 bg-white shadow-xl border border-gray-200 rounded-lg w-[1000px] z-50">
              {/* 👇 Dynamic grid: 2, 3, or 4 columns depending on number of categories */}
              <div
                className={`px-8 py-6 grid gap-12 max-h-[500px] overflow-y-auto ${
                  categories.length === 1
                    ? "grid-cols-1"
                    : categories.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-3"
                }`}
              >
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <div key={cat._id} className="pr-4">
                      {/* Level 1 header */}
                      <button
                        onClick={() => handleNavigate(cat.slug)}
                        className="block text-lg font-bold text-gray-900 hover:text-black mb-3 border-b border-gray-300 pb-1"
                      >
                        {cat.category_name}
                      </button>

                      {/* Level 2 & deeper */}
                      {cat.subcategories?.length > 0 ? (
                        cat.subcategories.map((sub) => (
                          <div key={sub._id} className="mb-3">
                            <button
                              onClick={() => handleNavigate(sub.slug)}
                              className="block text-base font-semibold text-gray-800 hover:text-black mb-1"
                            >
                              {sub.category_name}
                            </button>

                            {sub.subcategories?.length > 0 && (
                              <div className="ml-4 border-l border-gray-200 pl-2">
                                {sub.subcategories.map((child) =>
                                  renderNestedLevels(child, 3)
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No subcategories</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-sm col-span-3">
                    No categories found
                  </p>
                )}
              </div>
            </div>
          )}
        </li>

        {/* ✅ Keep rest same */}
        {categories.map((cat) => (
          <li key={cat._id} className="relative">
            {activeCategory === cat._id && (
              <div className="absolute left-0 top-full mt-2 bg-white shadow-xl border border-gray-200 rounded-lg w-[900px]">
                <div className="px-8 py-6 grid grid-cols-3 gap-12 max-h-[500px] overflow-y-auto">
                  {cat.subcategories?.length > 0 ? (
                    cat.subcategories.map((sub) => (
                      <div key={sub._id} className="pr-4">
                        {sub.subcategories?.length > 0 &&
                          sub.subcategories.map((child) =>
                            renderNestedLevels(child, 3)
                          )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-sm col-span-3">
                      No subcategories
                    </p>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}

        {/* ✅ Show Level 2 categories*/}
        {level2Categories.map((level2) => (
          <li
            key={level2._id}
            className="cursor-pointer text-gray-700 hover:text-black font-normal transition-colors duration-200"
            onClick={() => handleNavigate(level2.slug)}
          >
            {level2.category_name}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default CategoryNavbar;


