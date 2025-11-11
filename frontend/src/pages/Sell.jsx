import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { fetchCategories } from "../features/settings/settingsSlice";

export default function Sell() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categories, loading } = useSelector((state) => state.settings);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  return (
    <>
      <Navbar />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Sell Items</h1>

        {loading ? (
          <p>Loading categories...</p>
        ) : categories?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <div
                key={cat._id || cat.id}
                className="border rounded-lg p-4 flex flex-col items-center hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`/category/${cat._id || cat.id}`)}
              >
                <img
                  src={
                    cat.image
                      ? `http://127.0.0.1:8000/${cat.image}`
                      : "https://via.placeholder.com/100x100?text=No+Image"
                  }
                  alt={cat.category_name}
                  className="w-24 h-24 object-cover rounded mb-3"
                />
                <p className="capitalize font-medium">{cat.category_name}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mt-4">No categories found.</p>
        )}
      </div>
      <Footer />
    </>
  );
}
