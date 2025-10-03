import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import defaultAvatar from "../assets/default-avatar.png";
import { fetchAvatar } from "../features/settings/settingsSlice";

export default function Navbar() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const { avatarUrl } = useSelector((state) => state.settings);

  // Fetch avatar when navbar loads (only if logged in)
  useEffect(() => {
    if (token) {
      dispatch(fetchAvatar());
    }
  }, [token, dispatch]);

  return (
    <nav className="bg-white shadow p-4 flex items-center justify-between">
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
