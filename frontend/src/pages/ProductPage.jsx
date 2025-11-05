import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"; 
import Navbar from "../components/Navbar";
import CategoryNavbar from "../components/CategoryNavbar";
import IconBar from "../components/IconBar";

const ProductPage = () => {
  const params = useParams(); 
  const slug = params["*"]; // ✅ Get the FULL wildcard slug, e.g., "thrift/clothes"

  const [products, setProducts] = useState([]);

  // fetch products for that slug
  useEffect(() => {
    if (!slug) {
      setProducts([]); 
      return;
    }
    const fetchProducts = async () => {
      try {
        // ✅ This fetch will now use the CORRECT slug
        const res = await fetch(
          `http://localhost:8000/products/Category?slug=${slug}`
        );
        if (!res.ok) {
           // Handle 404 or other errors
           console.error("Failed to fetch products for slug:", slug);
           setProducts([]);
           return;
        }
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]); 
      }
    };
    fetchProducts();
  }, [slug]);

  // Get a cleaner title from the slug
  const title = slug ? slug.split("/").pop().replace(/-/g, ' ') : "Products";

  return (
    <>
      <Navbar />
      <CategoryNavbar />
      {/* ✅ This will now pass the CORRECT slug ("thrift/clothes") */}
      <IconBar parentSlug={slug} />

      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 capitalize">{title}</h1>

        {products.length > 0 ? (
          <div className="grid grid-cols-4 gap-6">
            {products.map((p) => (
              <div
                key={p._id}
                className="border rounded-lg shadow-sm p-4 hover:shadow-md transition"
              >
                <img
                  src={p.image_url} // Make sure this is the correct field
                  alt={p.name}
                  className="w-full h-48 object-cover rounded-md mb-3"
                />
                <h2 className="text-lg font-semibold">{p.name}</h2>
                <p className="text-gray-600">₹{p.price}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No products found.</p>
        )}
      </div>
    </>
  );
};

export default ProductPage;