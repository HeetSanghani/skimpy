import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios"; // Using axios for simpler async operations
import "./Products.css";

const BASE_URL = "http://localhost:8000";

// 🎯 Helper function to fetch the price of the first variant (Conceptual - optimize this on the backend)
const fetchFirstVariantPrice = async (productId) => {
    try {
        const res = await axios.get(`${BASE_URL}/Variant/list/${productId}`);
        const variants = res.data?.variants || [];
        // Return the price of the first available variant
        if (variants.length > 0) {
            return variants[0].price;
        }
    } catch (error) {
        // console.warn(`Could not fetch variant for product ${productId}`, error);
    }
    return null; // Fallback if no variants found
};


function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);

  const categoryId = searchParams.get("category"); // ?category=123

  // ✅ Fetch products and their variant prices from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        let url = `${BASE_URL}/Product/`;
        if (categoryId) {
          url += `?category=${categoryId}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = await res.json();
        const validData = Array.isArray(data) ? data : [];
        
        // 🎯 Step 1: Fetch the first variant's price for each product
        const productsWithPricePromises = validData.map(async (product) => {
            const variantPrice = await fetchFirstVariantPrice(product._id); 
            // Use the variant price if available, otherwise fall back to product.price
            const displayPrice = variantPrice !== null ? variantPrice : product.price;

            return {
                ...product,
                display_price: displayPrice, 
                // Placeholder for product type
                product_type_label: product.category_name || "Product Type/Category", 
            };
        });

        const productsWithPrice = await Promise.all(productsWithPricePromises);


        setProducts(productsWithPrice);
        setFilteredProducts(productsWithPrice);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]);

  // 🔍 Handle search filter
  useEffect(() => {
    const filtered = products.filter((p) =>
      p.product_name?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [search, products]);

  if (loading) {
    return (
      <div className="products-page">
        <div className="skeleton-grid product-grid three-col">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="sk-img" />
              <div className="sk-meta" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 🧩 Product Grid */}
      {filteredProducts.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="product-grid three-col">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Card with hover auto-image carousel ----------
function normalizeImageUrl(path) {
  if (!path) return null;
  return path.startsWith("http") ? path : `${BASE_URL}/${path}`;
}

// Helper to format price like Nike: 13995 -> 13,995.00
const formatPrice = (price) => {
    if (price === null || price === undefined || price === 'N/A') return "N/A";
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return "N/A"; // Handle non-numeric prices gracefully
    
    // Format to Indian locale with currency grouping and two decimals
    const formatted = numPrice.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return formatted;
};

function ProductCard({ product }) {
  // Use display_price (which is the first variant's price)
  const displayPrice = product.display_price; 
  
  // Use images from the product object
  const images = React.useMemo(() => {
    const arr = Array.isArray(product.images) ? product.images : [];
    const urls = arr.map(normalizeImageUrl).filter(Boolean);
    return urls.length > 0
      ? urls
      : ["https://via.placeholder.com/800x800?text=No+Image"];
  }, [product.images]);

  const [idx, setIdx] = useState(0);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!hover || images.length <= 1) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % images.length);
    }, 1200);
    return () => clearInterval(id);
  }, [hover, images.length]);

  useEffect(() => {
    if (!hover) setIdx(0); // reset to first image when leaving
  }, [hover]);

  return (
    <Link
      to={`/product/${product._id}`}
      className={`product-card futuristic ${hover ? "is-hover" : ""}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="media">
        <img src={images[idx]} alt={product.product_name} />
        <span className="glow" />
        {images.length > 1 && (
          <div className="dots">
            {images.map((_, i) => (
              <i key={i} className={i === idx ? "active" : ""} />
            ))}
          </div>
        )}
      </div>
      <div className="card-meta">
        {/* Updated product type display */}
        <h3 className="title">{product.product_name}</h3>
        {/* Updated price display */}
        <p className="price">MRP : ₹ {formatPrice(displayPrice)}</p>
      </div>
    </Link>
  );
}

export default Products;