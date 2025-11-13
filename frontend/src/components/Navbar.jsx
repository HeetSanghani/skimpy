// Navbar.jsx
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/default-avatar.png";
import { fetchAvatar } from "../features/settings/settingsSlice";
import axios from "axios";

const BASE_URL = "http://localhost:8000";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { token } = useSelector((state) => state.auth);
  const { avatarUrl } = useSelector((state) => state.settings);

  const [query, setQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch avatar when logged in
  useEffect(() => {
    if (token) {
      dispatch(fetchAvatar());
    }
  }, [token, dispatch]);

  // Sync search input with URL query param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get("search") || "";
    setQuery(searchParam);
  }, [location.search]);

  // Handle search form submission
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      navigate("/products", {
        replace: location.pathname.startsWith("/products"),
      });
      return;
    }
    navigate(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  // Fetch unread messages count periodically
  useEffect(() => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    const loadUnread = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/Chat/unread`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) {
          const total = res.data?.total_unread ?? 0;
          setUnreadCount(total);
        }
      } catch (err) {
        if (!cancelled) setUnreadCount(0);
      }
    };

    loadUnread();
    const interval = setInterval(loadUnread, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token]);

  return (
    <nav className="bg-white shadow p-4 flex items-center justify-between sticky top-0 z-50">
      {/* Logo */}
      <Link to="/" className="font-bold text-xl">
        SKIMPY
      </Link>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 mx-4">
        <label htmlFor="nav-search" className="sr-only">
          Search products
        </label>
        <div className="relative">
          <input
            id="nav-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products"
            className="w-full border rounded-lg p-2 pr-12 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-black px-3 py-1 text-sm font-semibold text-white transition hover:bg-gray-900"
            aria-label="Search"
          >
            Search
          </button>
        </div>
      </form>

      {/* Navigation Links */}
      <div className="flex items-center gap-4">
        <Link to="/about" className="hover:underline">
          About
        </Link>
        <Link to="/contact" className="hover:underline">
          Contact
        </Link>

        {/* 🛒 Cart Icon */}
        <Link to="/cart" className="hover:text-blue-600 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            className="w-7 h-7 fill-current"
          >
            <path d="M351.9 329.506H206.81l-3.072-12.56H368.16l26.63-116.019-217.23-26.04-9.952-58.09h-50.4v21.946h31.894l35.233 191.246a32.927 32.927 0 1 0 36.363 21.462h100.244a32.825 32.825 0 1 0 30.957-21.945zM181.427 197.45l186.51 22.358-17.258 75.195H198.917z" />
          </svg>
        </Link>

        {/* ❤️ Wishlist */}
        <Link to="/wishlist" className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            className="w-4 h-4 fill-current text-red-500"
          >
            <path d="M462.3 62.7C407 7.6 324.8-10.6 256 39.3 187.2-10.6 105 7.6 49.7 62.7c-61.5 61.6-61.5 161.5 0 223.2l193.5 194.3c12.5 12.6 32.8 12.6 45.3 0L462.3 285.9c61.5-61.7 61.5-161.6 0-223.2z" />
          </svg>
        </Link>

        {/* 💬 Messages (only if logged in) */}
        {token && (
          <Link
            to="/messages"
            className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100"
            aria-label="Messages"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-5 w-5 text-gray-700"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 8h10m-10 4h6m4 7.5-3.5-2.1H8a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4z"
              />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        )}

        {/* 👤 Profile / Login */}
        {token ? (
          <Link to="/profile">
            <img
              src={avatarUrl || defaultAvatar}
              alt="User Avatar"
              className="w-10 h-10 rounded-full object-cover border"
            />
          </Link>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 bg-black text-white rounded-full"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
