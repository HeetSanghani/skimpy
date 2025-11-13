// // src/pages/Home.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import { Link } from "react-router-dom";
// import Navbar from "../components/Navbar";
// import CategoryNavbar from "../components/CategoryNavbar";
// import Footer from "../components/Footer";
// import { fetchAllCategories, fetchAllProducts } from "../api/settingsApi";

// const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

// const normalizeImageUrl = (path) => {
//   if (!path) return null;
//   if (path.startsWith("http")) return path;
//   return `${API_BASE_URL}/uploads/${path}`;
// };

// const formatPrice = (price) => {
//   if (typeof price !== "number") return "—";
//   return price.toLocaleString("en-IN", {
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0,
//   });
// };

// const pickProductImages = (product) => {
//   if (!product) return [];
//   const rawImages = Array.isArray(product.images) ? product.images : [];
//   const fromObject = product.image ? [product.image] : [];
//   const images = [...rawImages, ...fromObject];
//   const normalized = images
//     .map((img) => normalizeImageUrl(typeof img === "string" ? img : img?.url))
//     .filter(Boolean);

//   if (normalized.length > 0) {
//     return normalized;
//   }
//   return ["https://via.placeholder.com/800x800?text=Product+Image"];
// };

// export default function Home() {
//   const [categories, setCategories] = useState([]);
//   const [featuredProducts, setFeaturedProducts] = useState([]);
//   const [isCategoriesLoading, setCategoriesLoading] = useState(true);
//   const [isProductsLoading, setProductsLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     let isActive = true;

//     const loadData = async () => {
//       try {
//         const [categoryData, productData] = await Promise.all([
//           fetchAllCategories(),
//           fetchAllProducts(),
//         ]);

//         if (!isActive) return;

//         setCategories(categoryData || []);
//         setFeaturedProducts((productData || []).slice(0, 8));
//       } catch (err) {
//         console.error("Failed to load home page data", err);
//         if (isActive) {
//           setError("We couldn't load the latest marketplace updates. Please try again shortly.");
//         }
//       } finally {
//         if (isActive) {
//           setCategoriesLoading(false);
//           setProductsLoading(false);
//         }
//       }
//     };

//     loadData();

//     return () => {
//       isActive = false;
//     };
//   }, []);

//   const featuredCategories = useMemo(
//     () => categories.filter((cat) => !cat.parent_id).slice(0, 6),
//     [categories]
//   );


//   return (
//     <div className="flex min-h-screen flex-col bg-gray-50">
//       <Navbar />
//       <CategoryNavbar />
//       <main className="flex-1">
//         <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500 text-white">
//           <div className="absolute inset-0 opacity-20">
//             <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-white blur-3xl"></div>
//             <div className="absolute right-0 top-1/2 h-72 w-72 rounded-full bg-white/40 blur-3xl"></div>
//           </div>

//           <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20 md:flex-row md:items-center md:justify-between">
//             <div className="max-w-2xl">
//               <p className="mb-3 inline-flex items-center rounded-full bg-white/20 px-4 py-1 text-sm font-medium uppercase tracking-wide">
//                 Handpicked Treasures
//               </p>
//               <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
//                 Discover categories crafted for every mood & moment
//               </h1>
//               <p className="mt-4 text-lg text-white/90 md:text-xl">
//                 Explore artisan-made collections, vintage finds, and homegrown brands from our creative community of sellers.
//               </p>


//             </div>

//             <div className="relative mx-auto w-full max-w-md">
//               <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-emerald-400/50 blur-xl"></div>
//               <div className="absolute -bottom-10 -right-4 h-32 w-32 rounded-full bg-sky-400/40 blur-2xl"></div>
//               <div className="relative rounded-3xl bg-white/10 p-6 backdrop-blur-lg shadow-xl">
//                 <div className="grid grid-cols-2 gap-4">
//                   {featuredCategories.slice(0, 4).map((category) => {
//                     const image = normalizeImageUrl(category.image);
//                     return (
//                       <Link
//                         to={`/products/${category.slug}`}
//                         key={category._id}
//                         className="group flex h-32 flex-col justify-between overflow-hidden rounded-2xl bg-white/10 p-4 transition hover:bg-white/80 hover:text-indigo-700"
//                       >
//                         <span className="text-sm font-semibold">{category.category_name}</span>
//                         <div className="flex-1"></div>
//                         {image ? (
//                           <img
//                             src={image}
//                             alt={category.category_name}
//                             className="h-12 w-12 self-end rounded-full border-2 border-white/40 object-cover"
//                           />
//                         ) : (
//                           <span className="self-end rounded-full border-2 border-dashed border-white/40 px-3 py-1 text-xs font-medium">
//                             Explore
//                           </span>
//                         )}
//                       </Link>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         <section className="mx-auto w-full max-w-6xl px-6 py-12">
//           <header className="flex flex-col gap-3 pb-6 md:flex-row md:items-center md:justify-between">
//             <div>
//               <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">
//                 Shop by Category
//               </h2>
//               <p className="text-gray-600">
//                 Browse top collections curated from our community of makers.
//               </p>
//             </div>
//           </header>

//           <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
//             {isCategoriesLoading ? (
//               [...Array(6)].map((_, idx) => (
//                 <div
//                   key={idx}
//                   className="h-40 animate-pulse rounded-2xl bg-white shadow-sm"
//                 ></div>
//               ))
//             ) : featuredCategories.length > 0 ? (
//               featuredCategories.map((category) => {
//                 const image = normalizeImageUrl(category.image);
//                 return (
//                   <Link
//                     key={category._id}
//                     to={`/products/${category.slug}`}
//                     className="group flex items-center gap-6 rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
//                   >
//                     <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-100 via-sky-100 to-emerald-100">
//                       {image ? (
//                         <img
//                           src={image}
//                           alt={category.category_name}
//                           className="h-full w-full object-cover"
//                         />
//                       ) : (
//                         <span className="text-sm font-semibold text-indigo-500">
//                           {category.category_name.slice(0, 1)}
//                         </span>
//                       )}
//                     </div>
//                     <div>
//                       <h3 className="text-lg font-semibold text-gray-900">
//                         {category.category_name}
//                       </h3>
//                       <p className="text-sm text-gray-600">
//                         Discover curated picks and new arrivals.
//                       </p>
//                     </div>
//                   </Link>
//                 );
//               })
//             ) : (
//               <div className="rounded-2xl bg-white p-6 shadow-sm">
//                 <p className="text-gray-600">
//                   We are preparing fresh categories for you. Check back soon!
//                 </p>
//               </div>
//             )}
//           </div>
//                 </section>

//         <section className="bg-white">
//           <div className="mx-auto w-full max-w-6xl px-6 py-12">
//             <header className="flex flex-col gap-3 pb-6 md:flex-row md:items-center md:justify-between">
//               <div>
//                 <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">
//                   Featured Products
//                 </h2>
//                 <p className="text-gray-600">
//                   Hand-selected picks from the marketplace, updated daily.
//                 </p>
//               </div>
//               {featuredProducts.length > 0 && (
//                 <Link
//                   to="/products"
//                   className="text-sm font-semibold text-gray-900 transition hover:text-indigo-500"
//                 >
//                   Browse all products →
//                 </Link>
//               )}
//             </header>

//             {error && (
//               <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
//                 {error}
//               </div>
//             )}

//             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
//               {isProductsLoading ? (
//                 [...Array(8)].map((_, idx) => (
//                   <div
//                     key={idx}
//                     className="flex h-[320px] flex-col rounded-2xl bg-gray-100 shadow-sm"
//                   >
//                     <div className="h-48 w-full animate-pulse rounded-t-2xl bg-gray-200"></div>
//                     <div className="flex flex-1 flex-col gap-3 p-4">
//                       <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
//                       <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
//                       <div className="mt-auto h-10 w-full animate-pulse rounded-lg bg-gray-200"></div>
//                     </div>
//                   </div>
//                 ))
//               ) : featuredProducts.length > 0 ? (
//                 featuredProducts.map((product) => {
//                   const images = pickProductImages(product);
//                   const price =
//                     product?.display_price ??
//                     product?.price ??
//                     product?.product_price ??
//                     null;

//                   return (
//                     <Link
//                       key={product._id}
//                       to={`/product/${product._id}`}
//                       className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
//                     >
//                       <div className="relative h-48 w-full overflow-hidden bg-gray-100">
//                         <img
//                           src={images[0]}
//                           alt={product.product_name}
//                           className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
//                         />
//                       </div>
//                       <div className="flex flex-1 flex-col p-5">
//                         <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
//                           {product.product_name}
//                         </h3>
//                         <p className="mt-2 text-sm text-gray-600 line-clamp-3">
//                           {product.description || "Explore the handcrafted details and unique finish of this item."}
//                         </p>
//                         <div className="mt-auto flex items-center justify-between pt-4">
//                           <span className="text-xl font-semibold text-gray-900 ">
//                             ₹ {formatPrice(price)}
//                           </span>
//                           <span className="text-sm font-medium text-gray-500">
//                             Tap to view
//                           </span>
//                         </div>
//                       </div>
//                     </Link>
//                   );
//                 })
//               ) : (
//                 <div className="sm:col-span-2 lg:col-span-4">
//                   <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-600">
//                     No products available yet. Add new products from the dashboard to see them here.
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//                 </section>
//             </main>

//           <Footer />
//         </div>
//     );
// }

















// src/pages/Home.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import CategoryNavbar from "../components/CategoryNavbar";
import Footer from "../components/Footer";
import { fetchAllCategories, fetchAllProducts } from "../api/settingsApi";

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://127.0.0.1:8000";

const normalizeImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}/uploads/${path}`;
};

const formatPrice = (price) => {
  if (typeof price !== "number") return "—";
  return price.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const pickProductImages = (product) => {
  if (!product) return [];
  const rawImages = Array.isArray(product.images) ? product.images : [];
  const fromObject = product.image ? [product.image] : [];
  const images = [...rawImages, ...fromObject];
  const normalized = images
    .map((img) => normalizeImageUrl(typeof img === "string" ? img : img?.url))
    .filter(Boolean);

  if (normalized.length > 0) {
    return normalized;
  }
  return ["https://via.placeholder.com/800x800?text=Product+Image"];
};

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [isCategoriesLoading, setCategoriesLoading] = useState(true);
  const [isProductsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      try {
        const [categoryData, productData] = await Promise.all([
          fetchAllCategories(),
          fetchAllProducts(),
        ]);

        if (!isActive) return;

        setCategories(categoryData || []);
        setFeaturedProducts((productData || []).slice(0, 8));
      } catch (err) {
        console.error("Failed to load home page data", err);
        if (isActive) {
          setError(
            "We couldn't load the latest marketplace updates. Please try again shortly."
          );
        }
      } finally {
        if (isActive) {
          setCategoriesLoading(false);
          setProductsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isActive = false;
    };
  }, []);

  const featuredCategories = useMemo(
    () => categories.filter((cat) => !cat.parent_id).slice(0, 6),
    [categories]
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <CategoryNavbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500 text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-white blur-3xl"></div>
            <div className="absolute right-0 top-1/2 h-72 w-72 rounded-full bg-white/40 blur-3xl"></div>
          </div>

          <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 inline-flex items-center rounded-full bg-white/20 px-4 py-1 text-sm font-medium uppercase tracking-wide">
                Handpicked Treasures
              </p>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
                Discover categories crafted for every mood & moment
              </h1>
              <p className="mt-4 text-lg text-white/90 md:text-xl">
                Explore artisan-made collections, vintage finds, and homegrown
                brands from our creative community of sellers.
              </p>
            </div>

            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-emerald-400/50 blur-xl"></div>
              <div className="absolute -bottom-10 -right-4 h-32 w-32 rounded-full bg-sky-400/40 blur-2xl"></div>
              <div className="relative rounded-3xl bg-white/10 p-6 backdrop-blur-lg shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  {featuredCategories.slice(0, 4).map((category) => {
                    const image = normalizeImageUrl(category.image);
                    return (
                      <Link
                        to={`/products/${category.slug}`}
                        key={category._id}
                        className="group flex h-32 flex-col justify-between overflow-hidden rounded-2xl bg-white/10 p-4 transition hover:bg-white/80 hover:text-indigo-700"
                      >
                        <span className="text-sm font-semibold">
                          {category.category_name}
                        </span>
                        <div className="flex-1"></div>
                        {image ? (
                          <img
                            src={image}
                            alt={category.category_name}
                            className="h-12 w-12 self-end rounded-full border-2 border-white/40 object-cover"
                          />
                        ) : (
                          <span className="self-end rounded-full border-2 border-dashed border-white/40 px-3 py-1 text-xs font-medium">
                            Explore
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-12">
          <header className="flex flex-col gap-3 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">
                Shop by Category
              </h2>
              <p className="text-gray-600">
                Browse top collections curated from our community of makers.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isCategoriesLoading ? (
              [...Array(6)].map((_, idx) => (
                <div
                  key={idx}
                  className="h-40 animate-pulse rounded-2xl bg-white shadow-sm"
                ></div>
              ))
            ) : featuredCategories.length > 0 ? (
              featuredCategories.map((category) => {
                const image = normalizeImageUrl(category.image);
                return (
                  <Link
                    key={category._id}
                    to={`/products/${category.slug}`}
                    className="group flex items-center gap-6 rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-100 via-sky-100 to-emerald-100">
                      {image ? (
                        <img
                          src={image}
                          alt={category.category_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-indigo-500">
                          {category.category_name.slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.category_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Discover curated picks and new arrivals.
                      </p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-gray-600">
                  We are preparing fresh categories for you. Check back soon!
                </p>
              </div>
            )}
          </div>
        </section>


        {/* Featured Products Section */}
        <section className="bg-white">
          <div className="mx-auto w-full max-w-6xl px-6 py-12">
            <header className="flex flex-col gap-3 pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">
                  Featured Products
                </h2>
                <p className="text-gray-600">
                  Hand-selected picks from the marketplace, updated daily.
                </p>
              </div>
              {featuredProducts.length > 0 && (
                <Link
                  to="/products"
                  className="text-sm font-semibold text-gray-900 transition hover:text-indigo-500"
                >
                  Browse all products →
                </Link>
              )}
            </header>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {isProductsLoading ? (
                [...Array(8)].map((_, idx) => (
                  <div
                    key={idx}
                    className="flex h-[320px] flex-col rounded-2xl bg-gray-100 shadow-sm"
                  >
                    <div className="h-48 w-full animate-pulse rounded-t-2xl bg-gray-200"></div>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200"></div>
                      <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
                      <div className="mt-auto h-10 w-full animate-pulse rounded-lg bg-gray-200"></div>
                    </div>
                  </div>
                ))
              ) : featuredProducts.length > 0 ? (
                featuredProducts.map((product) => {
                  const images = pickProductImages(product);
                  const price =
                    product?.display_price ??
                    product?.price ??
                    product?.product_price ??
                    null;

                  return (
                    <Link
                      key={product._id}
                      to={`/product/${product._id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      {/* Image with Taller Height (4:5 ratio) */}
                      <div className="relative w-full overflow-hidden rounded-t-2xl bg-gray-100" style={{ aspectRatio: "4/5" }}>
                        <img
                          src={images[0]}
                          alt={product.product_name}
                          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      </div>

                      <div className="flex flex-col justify-between p-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {product.product_name}
                          </h3>
                          <p className="text-gray-700 font-medium mt-1">
                            ₹ {formatPrice(price)}
                          </p>
                        </div>
                        <button className="mt-3 w-full rounded-xl bg-black py-2 text-sm font-medium text-white transition hover:bg-gray-800">
                          Tap to view
                        </button>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="sm:col-span-2 lg:col-span-4">
                  <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-600">
                    No products available yet. Add new products from the
                    dashboard to see them here.
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
