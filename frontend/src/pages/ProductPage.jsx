

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import CategoryNavbar from "../components/CategoryNavbar";
import IconBar from "../components/IconBar";


const ProductPage = () => {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [parentId, setParentId] = useState(null); // ✅ new state

  // fetch parent category (Level 2) by slug to get _id
  useEffect(() => {
    if (!slug) return;
    const fetchParent = async () => {
      try {
        const res = await fetch(`http://localhost:8000/Category?slug=${slug}`);
        const data = await res.json();
        if (data.length > 0) {
          setParentId(data[0]._id); // ✅ save parent _id
        }
      } catch (err) {
        console.error("Error fetching parent category:", err);
      }
    };
    fetchParent();
  }, [slug]);

  // fetch products for that slug
  useEffect(() => {
    if (!slug) return;
    const fetchProducts = async () => {
      try {
        const res = await fetch(`http://localhost:8000/products/Category?slug=${slug}`);
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };
    fetchProducts();
  }, [slug]);

  return (
    <>
      <Navbar />
      <CategoryNavbar />
      {/* ✅ pass parentId here */}
      <IconBar parentSlug={slug} /> 

      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 capitalize">{slug} Products</h1>

        {products.length > 0 ? (
          <div className="grid grid-cols-4 gap-6">
            {products.map((p) => (
              <div
                key={p._id}
                className="border rounded-lg shadow-sm p-4 hover:shadow-md transition"
              >
                <img
                  src={p.image_url}
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

