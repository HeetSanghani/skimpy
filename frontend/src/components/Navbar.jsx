import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Search } from "lucide-react"; // 👉 icon (install lucide-react if not already)

function Navbar() {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching for:", searchTerm);
    // navigate(`/search?query=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* 🟢 Left: Logo */}
        <Link
          to="/"
          className="text-2xl font-extrabold tracking-wide text-black hover:text-gray-700"
        >
          SKIMPY
        </Link>

        {/* 🔍 Middle: Search Bar */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex items-center w-full max-w-md mx-6 bg-gray-100 rounded-full px-4"
        >
          <input
            type="text"
            placeholder="Search products"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow bg-gray-100 border-none focus:ring-0 text-sm py-2 px-2 placeholder-gray-500 outline-none"
          />
          <button
            type="submit"
            className="p-2 text-gray-600 hover:text-black transition-colors"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
        </form>

        {/* 🔵 Right: Nav Links */}
        <div className="flex items-center space-x-6 text-sm font-medium">
          <Link to="/" className="hover:text-gray-700">
            Home
          </Link>
          <Link to="/about" className="hover:text-gray-700">
            About
          </Link>
          <Link to="/contact" className="hover:text-gray-700">
            Contact
          </Link>
          <Link to="/cart" className="hover:text-gray-700">
            Cart
          </Link>
          <Link to="/profile" className="hover:text-gray-700">
            Profile
          </Link>
          <Link
            to="/login"
            className="bg-black text-white px-4 py-1.5 rounded-full hover:bg-gray-900 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
