// Navbar.jsx
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/default-avatar.png";
import { fetchAvatar, fetchCategories } from "../features/settings/settingsSlice";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { Heart, ShoppingCart, Package, ChevronDown } from "lucide-react";

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { token } = useSelector((state) => state.auth);
  const { avatarUrl, categories } = useSelector((state) => state.settings);

  const [query, setQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);

  useEffect(() => {
    if (token) dispatch(fetchAvatar());
  }, [token, dispatch]);

  useEffect(() => {
    if (!categories || categories.length === 0) dispatch(fetchCategories());
  }, [dispatch, categories]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setQuery(params.get("search") || "");
  }, [location.search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      navigate("/products", { replace: location.pathname.startsWith("/products") });
    } else {
      navigate(`/products?search=${encodeURIComponent(trimmed)}`);
    }
    setIsMenuOpen(false);
  };

  const safeCategories = Array.isArray(categories) ? categories : [];
  const visibleCategories = safeCategories.slice(0, 12);
  const handleCategoryNavigate = (cat) => {
    const id = cat?._id || cat?.id;
    if (!id) return;
    navigate(`/category/${id}`);
    setIsCategoriesOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <nav
      className={`
        sticky top-0 z-50
        bg-[#0a0a0a]/95 backdrop-blur-xl
        border-b border-white/8
        transition-all duration-300
        ${isScrolled ? "shadow-lg shadow-black/40 py-2" : "shadow-sm py-3"}
      `}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Desktop Layout: 3-column grid ── */}
        <div className="hidden md:grid md:grid-cols-[auto_1fr_auto] md:items-center md:gap-6">

          {/* LEFT — Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0 group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-indigo-300 transition-shadow duration-300">
              <span className="text-white font-black text-sm leading-none">S</span>
            </div>
            <span className="font-sora font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent group-hover:from-indigo-300 group-hover:to-fuchsia-400 transition-all duration-300">
              SKIMPY
            </span>
          </Link>

          {/* CENTER — Categories + Search */}
          <div className="w-full max-w-2xl mx-auto flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCategoriesOpen((v) => !v)}
                onBlur={() => setTimeout(() => setIsCategoriesOpen(false), 120)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/12 bg-white/6 text-gray-200 hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-sm font-semibold"
              >
                Categories
                <ChevronDown size={16} strokeWidth={2} className={`transition-transform duration-200 ${isCategoriesOpen ? "rotate-180" : "rotate-0"}`} />
              </button>

              {isCategoriesOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-2xl border border-white/10 bg-[#0d0d0d]/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
                  <div className="max-h-80 overflow-auto py-2">
                    {visibleCategories.map((cat) => (
                      <button
                        key={cat._id || cat.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleCategoryNavigate(cat)}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-white/5 transition-colors"
                      >
                        {cat.category_name || cat.name || "Category"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSearchSubmit} className="flex-1">
            <label htmlFor="nav-search-desktop" className="sr-only">Search products</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
              </span>
              <input
                id="nav-search-desktop"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search for products, brands, categories…"
                className={`
                  w-full pl-11 pr-28 py-2.5 rounded-full text-sm
                  border transition-all duration-300
                  bg-white/8 text-white placeholder-gray-500
                  focus:outline-none
                  ${searchFocused
                    ? "border-indigo-500/60 ring-2 ring-indigo-500/20 bg-white/12"
                    : "border-white/12 hover:border-white/20"
                  }
                `}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Search
              </button>
            </div>
            </form>
          </div>

          {/* RIGHT — Action Icons + Avatar */}
          <div className="flex items-center gap-1 shrink-0">

            {/* Icons (Logged in only) */}
            {token && (
              <>
                <NavIconBtn to="/wishlist" label="Wishlist">
                  <Heart size={18} strokeWidth={1.8} />
                </NavIconBtn>

                <NavIconBtn to="/my-cart" label="Cart">
                  <ShoppingCart size={18} strokeWidth={1.8} />
                </NavIconBtn>
              </>
            )}

            {/* Orders (logged in only) */}
            {token && (
              <NavIconBtn to="/my-orders" label="Orders">
                <Package size={18} strokeWidth={1.8} />
              </NavIconBtn>
            )}

            {/* Divider (only if logged in) */}
            {token && <div className="w-px h-6 bg-white/15 mx-2" />}

            {/* Profile / Login */}
            {token ? (
              <Link
                to="/profile"
                className="relative group"
                title="My Profile"
              >
                <img
                  src={avatarUrl || defaultAvatar}
                  alt="User Avatar"
                  className="w-9 h-9 rounded-full object-cover border-2 border-white/20 group-hover:border-indigo-400 transition-all duration-300 shadow-sm hover:shadow-md"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0a0a0a]" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="ml-1 px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* ── Mobile Layout ── */}
        <div className="flex md:hidden items-center justify-between gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-xs">S</span>
            </div>
            <span className="font-sora font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              SKIMPY
            </span>
          </Link>

          {/* Mobile right: avatar + hamburger */}
          <div className="flex items-center gap-2">
            {token && (
              <Link to="/profile">
                <img
                  src={avatarUrl || defaultAvatar}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border-2 border-indigo-400 shadow-sm"
                />
              </Link>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 transition-colors duration-200"
            >
              <FontAwesomeIcon
                icon={isMenuOpen ? faXmark : faBars}
                className="text-gray-300 text-base transition-transform duration-300"
                style={{ transform: isMenuOpen ? "rotate(90deg)" : "rotate(0)" }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Dropdown ── */}
      <div
        className={`
          md:hidden overflow-hidden transition-all duration-300 ease-in-out
          ${isMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div className="px-4 pt-3 pb-4 space-y-3 border-t border-white/10 bg-[#0d0d0d]">
          {/* Mobile Categories */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              type="button"
              onClick={() => {
                navigate("/sell");
                setIsMenuOpen(false);
              }}
              className="flex-shrink-0 px-4 py-2 rounded-full bg-white/8 border border-white/12 text-sm font-semibold text-indigo-300"
            >
              Categories
            </button>
            {visibleCategories.slice(0, 8).map((cat) => (
              <button
                key={cat._id || cat.id}
                type="button"
                onClick={() => handleCategoryNavigate(cat)}
                className="flex-shrink-0 px-4 py-2 rounded-full bg-white/6 border border-white/10 text-sm text-gray-200"
              >
                {cat.category_name || cat.name || "Category"}
              </button>
            ))}
          </div>

          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit}>
            <label htmlFor="nav-search-mobile" className="sr-only">Search</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
              </span>
              <input
                id="nav-search-mobile"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-white/12 bg-white/8 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all duration-200"
              />
            </div>
          </form>

          {/* Mobile Icon Links (Logged in only) */}
          {token ? (
            <div className="flex justify-around items-center pt-1">
              <MobileNavLink to="/wishlist" label="Wishlist" icon={Heart} onClick={() => setIsMenuOpen(false)} />
              <MobileNavLink to="/my-cart" label="Cart" icon={ShoppingCart} onClick={() => setIsMenuOpen(false)} />
              <MobileNavLink to="/my-orders" label="Orders" icon={Package} onClick={() => setIsMenuOpen(false)} />
            </div>
          ) : null}

          {/* Mobile Login */}
          {!token && (
            <Link
              to="/login"
              onClick={() => setIsMenuOpen(false)}
              className="block w-full text-center py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-sm"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ── Reusable desktop icon button with tooltip ── */
function NavIconBtn({ to, label, children }) {
  return (
    <Link
      to={to}
      title={label}
      className="relative group w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all duration-200"
    >
      <span className="text-base">{children}</span>
      {/* Tooltip */}
      <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
        {label}
      </span>
    </Link>
  );
}

/* ── Reusable mobile nav link ── */
function MobileNavLink({ to, label, icon: Icon, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex flex-col items-center gap-1 text-gray-400 hover:text-indigo-400 transition-colors duration-200"
    >
      <div className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-indigo-500/10 transition-colors duration-200">
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}
