import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAccountDetails } from "../features/settings/settingsSlice";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  getDashboard,
  getMyListings,
  getEarningsStats,
  getOrders,
} from "../api/sellerDashboardApi";
import { Package, ShoppingCart, Plus, TrendingUp, IndianRupee, Check, X, Truck, Box } from "lucide-react";
import { updateOrderStatus } from "../api/orderApi";
import toast from "react-hot-toast";

export default function SellerDashboard() {
  const dispatch = useDispatch();
  const { account } = useSelector((state) => state.settings);
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboardData, setDashboardData] = useState(null);
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["overview", "listings", "earnings", "orders"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (!account) {
      dispatch(fetchAccountDetails());
    }
  }, [account, dispatch]);

  useEffect(() => {
    if (account && account.role && account.role !== "seller") {
      navigate("/", { replace: true });
    }
  }, [account, navigate]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === "listings") {
      loadListings();
    } else if (activeTab === "earnings") {
      loadEarnings();
    } else if (activeTab === "orders") {
      loadOrders();
    }
  }, [activeTab, orderStatusFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getDashboard(10, 10);
      setDashboardData(data);
      setListings(data.my_listings || []);
      setStats(data.stats || {});
      setOrders(data.orders || []);
      setError(null);
    } catch (err) {
      console.error("Error loading dashboard:", err);
      setError(err.response?.data?.detail || "Failed to load dashboard data. Please try again.");
      setStats({
        total_products: 0,
        total_sales: 0,
        total_revenue: 0.0,
        pending_orders: 0,
        completed_orders: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadListings = async () => {
    try {
      setLoading(true);
      const data = await getMyListings(50, 0);
      setListings(data);
      setError(null);
    } catch (err) {
      console.error("Error loading listings:", err);
      setError(err.response?.data?.detail || "Failed to load listings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const data = await getEarningsStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error("Error loading earnings:", err);
      setError(err.response?.data?.detail || "Failed to load earnings data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders(orderStatusFilter || null, 50, 0);
      const ordersArray = Array.isArray(data) ? data : data.orders || [];
      setOrders(ordersArray);
      setError(null);
    } catch (err) {
      console.error("Error loading orders:", err);
      setError(err.response?.data?.detail || "Failed to load orders. Please try again.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order ${newStatus} successfully!`);
      loadOrders();
      loadDashboardData();
    } catch (err) {
      console.error("Status update error:", err);
      toast.error(err.response?.data?.detail || "Failed to update status");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "listings", label: "My Listings", icon: Package },
    { id: "earnings", label: "Earnings / Sales", icon: IndianRupee },
    { id: "orders", label: "Orders", icon: ShoppingCart },
  ];

  // ── Shared helpers ──────────────────────────────────────────────────────────
  const Spinner = ({ label }) => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mb-4" />
      <p className="text-gray-400 font-medium">{label}</p>
    </div>
  );

  const statusBadge = (status) => {
    const s = (status || "pending").toLowerCase();
    if (s === "completed" || s === "delivered")
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    if (s === "pending" || s === "pending priority approval")
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    if (s === "processing")
      return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    if (s === "shipped")
      return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
    if (s === "cancelled" || s === "rejected")
      return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
    return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
  };

  const OrderActions = ({ order }) => {
    const status = (order.status || "").toLowerCase();
    const id = order._id || order.id;
    if (status === "pending" || status === "pending priority approval") return (
      <div className="flex gap-2">
        <button onClick={() => handleStatusUpdate(id, "Approved")}
          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors" title="Approve">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={() => handleStatusUpdate(id, "Rejected")}
          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors" title="Reject">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
    if (status === "approved") return (
      <button onClick={() => handleStatusUpdate(id, "Processing")}
        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors" title="Start Processing">
        <Box className="w-4 h-4" />
      </button>
    );
    if (status === "processing") return (
      <button onClick={() => handleStatusUpdate(id, "Shipped")}
        className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 transition-colors" title="Mark Shipped">
        <Truck className="w-4 h-4" />
      </button>
    );
    if (status === "shipped") return (
      <button onClick={() => handleStatusUpdate(id, "Delivered")}
        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors" title="Mark Delivered">
        <Check className="w-4 h-4" />
      </button>
    );
    return null;
  };

  // ── Stat card ───────────────────────────────────────────────────────────────
  const StatCard = ({ label, value, Icon, iconClass, onClick }) => (
    <div
      onClick={onClick}
      className={`relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 bg-indigo-500 -mr-10 -mt-10 pointer-events-none" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{label}</p>
          <p className="text-3xl font-sora font-extrabold text-white mt-2">{value}</p>
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconClass}`}>
          <Icon className="w-7 h-7" />
        </div>
      </div>
    </div>
  );

  // ── Orders table (reused in overview + orders tab) ──────────────────────────
  const OrdersTable = ({ rows }) => (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full">
        <thead>
          <tr className="bg-white/5 border-b border-white/10">
            {["Order ID", "Date", "Customer", "Amount", "Status", "Actions"].map((h) => (
              <th key={h} className={`px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((order) => (
            <tr key={order._id || order.id} className="hover:bg-white/5 transition-colors">
              <td className="px-5 py-4 text-sm font-mono font-medium text-indigo-400 whitespace-nowrap">
                {order.order_id || "#" + (order._id?.slice(-8) || order.id?.slice(-8) || "N/A")}
              </td>
              <td className="px-5 py-4 text-sm text-gray-400 whitespace-nowrap">{formatDate(order.created_at)}</td>
              <td className="px-5 py-4 text-sm text-gray-300 whitespace-nowrap">
                {order.shipping_address?.fullname || order.user_id?.slice(-6) || "N/A"}
              </td>
              <td className="px-5 py-4 text-sm font-semibold text-white whitespace-nowrap">{formatCurrency(order.total_amount || 0)}</td>
              <td className="px-5 py-4 whitespace-nowrap">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusBadge(order.status)}`}>
                  {order.status || "pending"}
                </span>
              </td>
              <td className="px-5 py-4 whitespace-nowrap text-right">
                <OrderActions order={order} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-inter">
      <Navbar />

      {/* Ambient background glows */}
      <div className="fixed top-20 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-purple-900/15 rounded-full blur-[128px] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">

        {/* ── Page Header ── */}
        <div className="mb-8 md:mb-10">
          <h1 className="font-sora text-3xl md:text-5xl font-extrabold tracking-tight">
            <span className="text-white">Seller </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-400">
              Dashboard
            </span>
          </h1>
          <p className="mt-2 text-gray-400 text-sm md:text-lg">Manage your products, sales, and orders</p>
        </div>

        {/* ── Tab Bar ── */}
        <div className="mb-6 md:mb-8 border-b border-white/10 overflow-x-auto scrollbar-hide">
          <nav className="flex gap-4 md:gap-1 min-w-max pb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 md:px-5 md:py-3.5 text-sm font-semibold rounded-t-xl border-b-2 whitespace-nowrap transition-all duration-200 ${active
                    ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                    : "border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-5 py-4 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ── Content ── */}
        {loading && activeTab === "overview" && !dashboardData ? (
          <Spinner label="Loading dashboard..." />
        ) : (
          <>
            {/* ════════════════════════════════════════════════════
                OVERVIEW TAB
            ════════════════════════════════════════════════════ */}
            {activeTab === "overview" && (
              <div className="space-y-8">

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <StatCard
                    label="Total Products"
                    value={stats?.total_products || 0}
                    Icon={Package}
                    iconClass="bg-indigo-500/20 text-indigo-400"
                    onClick={() => navigate(`/seller/${account?.user_id || account?._id}`)}
                  />
                  <StatCard
                    label="Total Sales"
                    value={stats?.total_sales || 0}
                    Icon={TrendingUp}
                    iconClass="bg-emerald-500/20 text-emerald-400"
                  />
                  <StatCard
                    label="Total Revenue"
                    value={formatCurrency(stats?.total_revenue || 0)}
                    Icon={IndianRupee}
                    iconClass="bg-amber-500/20 text-amber-400"
                  />
                  <StatCard
                    label="Pending Orders"
                    value={stats?.pending_orders || 0}
                    Icon={ShoppingCart}
                    iconClass="bg-purple-500/20 text-purple-400"
                    onClick={() => { setActiveTab("orders"); setOrderStatusFilter("pending"); }}
                  />
                </div>

                {/* Quick Actions */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <h2 className="font-sora text-xl font-bold text-white mb-5">Quick Actions</h2>
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => navigate("/sell")}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105"
                    >
                      <Plus className="w-5 h-5" />
                      Add New Product
                    </button>
                    <button
                      onClick={() => setActiveTab("listings")}
                      className="px-6 py-3 border border-white/20 text-gray-300 font-semibold rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-200"
                    >
                      View All Listings
                    </button>
                  </div>
                </div>

                {/* Recent Listings */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-sora text-xl font-bold text-white">Recent Listings</h2>
                    <button
                      onClick={() => setActiveTab("listings")}
                      className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                    >
                      View all →
                    </button>
                  </div>
                  {listings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {listings.slice(0, 6).map((product) => (
                        <div
                          key={product._id || product.id}
                          className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer"
                          onClick={() => navigate(`/seller/product/${product._id ?? product.id}`)}
                        >
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={(product.images[0] || "").startsWith("http") ? product.images[0] : `/${product.images[0]}`}
                              alt={product.product_name}
                              className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-44 bg-white/5 flex items-center justify-center">
                              <Package className="w-12 h-12 text-gray-600" />
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="font-sora font-semibold text-white truncate">{product.product_name}</h3>
                            <p className="text-lg font-bold text-indigo-400 mt-1">{formatCurrency(product.price)}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {product.variants && product.variants.length > 0
                                ? product.variants.slice(0, 3).map(v => `${v.size || v.name}: ${v.stock}`).join(", ") + (product.variants.length > 3 ? "..." : "")
                                : `Stock: ${product.stock || 0}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="w-14 h-14 mx-auto mb-3 text-gray-600" />
                      <p className="text-gray-400 mb-4">No listings yet. Add your first product!</p>
                      <button onClick={() => navigate("/sell")} className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                        Add Product →
                      </button>
                    </div>
                  )}
                </div>

                {/* Recent Orders */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-sora text-xl font-bold text-white">Recent Orders</h2>
                    <button
                      onClick={() => setActiveTab("orders")}
                      className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                    >
                      View all →
                    </button>
                  </div>
                  {orders.length > 0 ? (
                    <OrdersTable rows={orders.slice(0, 5)} />
                  ) : (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-14 h-14 mx-auto mb-3 text-gray-600" />
                      <p className="text-gray-400">No orders yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════════════
                MY LISTINGS TAB
            ════════════════════════════════════════════════════ */}
            {activeTab === "listings" && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-sora text-2xl font-bold text-white">My Listings</h2>
                  <button
                    onClick={() => navigate("/sell")}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Product
                  </button>
                </div>

                {loading ? (
                  <Spinner label="Loading listings..." />
                ) : listings.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((product) => (
                      <div
                        key={product._id || product.id}
                        className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer"
                        onClick={() => navigate(`/seller/product/${product._id ?? product.id}`)}
                      >
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={(product.images[0] || "").startsWith("http") ? product.images[0] : `/${product.images[0]}`}
                            alt={product.product_name}
                            className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-56 bg-white/5 flex items-center justify-center">
                            <Package className="w-16 h-16 text-gray-600" />
                          </div>
                        )}
                        <div className="p-5">
                          <h3 className="font-sora font-semibold text-lg text-white truncate">{product.product_name}</h3>
                          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description || "No description"}</p>
                          <div className="mt-4 flex items-center justify-between">
                            <p className="text-xl font-bold text-indigo-400">{formatCurrency(product.price)}</p>
                            {product.variants && product.variants.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {product.variants.map((v) => (
                                  <span key={v._id || v.id} className={`text-xs px-2 py-1 rounded-lg border ${v.stock > 0 ? "bg-white/5 border-white/10 text-gray-300" : "bg-rose-500/10 border-rose-500/20 text-rose-400"}`}>
                                    {v.size || v.name || v.sku}: <b>{v.stock}</b>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${product.stock > 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"}`}>
                                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-xs text-gray-500">Condition: {product.product_condition || "N/A"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Package className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <p className="text-lg text-gray-300 mb-2">No listings yet.</p>
                    <p className="text-gray-500 mb-6">Start selling by adding your first product!</p>
                    <button
                      onClick={() => navigate("/sell")}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 hover:scale-105"
                    >
                      Add Your First Product
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════════════
                EARNINGS TAB
            ════════════════════════════════════════════════════ */}
            {activeTab === "earnings" && (
              <div className="space-y-8">
                {loading ? (
                  <Spinner label="Loading earnings..." />
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      <StatCard label="Total Products" value={stats?.total_products || 0} Icon={Package} iconClass="bg-indigo-500/20 text-indigo-400" />
                      <StatCard label="Total Sales" value={stats?.total_sales || 0} Icon={TrendingUp} iconClass="bg-emerald-500/20 text-emerald-400" />
                      <StatCard label="Total Revenue" value={formatCurrency(stats?.total_revenue || 0)} Icon={IndianRupee} iconClass="bg-amber-500/20 text-amber-400" />
                      <StatCard
                        label="Completed Orders"
                        value={stats?.completed_orders || 0}
                        Icon={ShoppingCart}
                        iconClass="bg-purple-500/20 text-purple-400"
                        onClick={() => { setActiveTab("orders"); setOrderStatusFilter("delivered"); }}
                      />
                    </div>

                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                      <h2 className="font-sora text-xl font-bold text-white mb-6">Sales Summary</h2>
                      <div className="space-y-0 divide-y divide-white/10">
                        {[
                          { label: "Pending Orders", value: stats?.pending_orders || 0, color: "text-amber-400" },
                          { label: "Completed Orders", value: stats?.completed_orders || 0, color: "text-emerald-400" },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="flex justify-between items-center py-4">
                            <span className="text-gray-400">{label}</span>
                            <span className={`text-lg font-bold ${color}`}>{value}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center py-4">
                          <span className="text-white font-semibold">Total Revenue</span>
                          <span className="text-2xl font-sora font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
                            {formatCurrency(stats?.total_revenue || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════════════
                ORDERS TAB
            ════════════════════════════════════════════════════ */}
            {activeTab === "orders" && (
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-sora text-2xl font-bold text-white">Orders</h2>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="bg-white/5 border border-white/20 text-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  >
                    <option value="" className="bg-[#1a1a2e]">All Orders</option>
                    <option value="pending" className="bg-[#1a1a2e]">Pending</option>
                    <option value="processing" className="bg-[#1a1a2e]">Processing</option>
                    <option value="completed" className="bg-[#1a1a2e]">Completed</option>
                    <option value="delivered" className="bg-[#1a1a2e]">Delivered</option>
                    <option value="cancelled" className="bg-[#1a1a2e]">Cancelled</option>
                  </select>
                </div>

                {loading ? (
                  <Spinner label="Loading orders..." />
                ) : orders.length > 0 ? (
                  <OrdersTable rows={orders} />
                ) : (
                  <div className="text-center py-16">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400">No orders found.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
