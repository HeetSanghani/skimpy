import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import defaultAvatar from "../assets/default-avatar.png";
import { fetchAvatar } from "../features/settings/settingsSlice";
import axios from "axios";

const BASE_URL = "http://localhost:8000";

export default function Navbar() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { avatarUrl } = useSelector((state) => state.settings);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch avatar when navbar loads (only if logged in)
  useEffect(() => {
    if (token) {
      dispatch(fetchAvatar());
    }
  }, [token, dispatch]);

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
        if (!cancelled) {
          setUnreadCount(0);
        }
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
      <div className="flex-1 mx-4">
        <input
          type="text"
          placeholder="Search products"
          className="w-full border rounded-lg p-2"
        />
      </div>

      {/* Navigation Links */}
      <div className="flex items-center gap-4">
        <Link to="/" className="hover:underline">Home</Link>
        <Link to="/about" className="hover:underline">About</Link>
        <Link to="/contact" className="hover:underline">Contact</Link>
        <Link to="/cart" className="hover:underline">Cart</Link>
        <Link to="/wishlist" className="hover:underline">Wishlist</Link>
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

        {/* Profile / Login */}
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
