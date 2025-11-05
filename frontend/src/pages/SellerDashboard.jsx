import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Package, DollarSign, ShoppingCart, Plus, TrendingUp } from "lucide-react";

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

  // Ensure we have account details and role; if not seller, redirect
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

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load data when tab changes
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
      setError("Failed to load dashboard data. Please try again.");
      // Initialize empty state
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
      setError("Failed to load listings. Please try again.");
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
      setError("Failed to load earnings data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders(orderStatusFilter || null, 50, 0);
      // Handle both array response and object with orders property
      const ordersArray = Array.isArray(data) ? data : data.orders || [];
      setOrders(ordersArray);
      setError(null);
    } catch (err) {
      console.error("Error loading orders:", err);
      setError("Failed to load orders. Please try again.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
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
    { id: "earnings", label: "Earnings / Sales", icon: DollarSign },
    { id: "orders", label: "Orders", icon: ShoppingCart },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your products, sales, and orders</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? "border-black text-black"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Content */}
          {loading && activeTab === "overview" && !dashboardData ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Products</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">
                            {stats?.total_products || 0}
                          </p>
                        </div>
                        <Package className="w-12 h-12 text-blue-500" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Sales</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">
                            {stats?.total_sales || 0}
                          </p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-green-500" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">
                            {formatCurrency(stats?.total_revenue || 0)}
                          </p>
                        </div>
                        <DollarSign className="w-12 h-12 text-yellow-500" />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">
                            {stats?.pending_orders || 0}
                          </p>
                        </div>
                        <ShoppingCart className="w-12 h-12 text-orange-500" />
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="flex gap-4">
                      <button
                        onClick={() => navigate("/sell")}
                        className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        Add New Product
                      </button>
                      <button
                        onClick={() => setActiveTab("listings")}
                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        View All Listings
                      </button>
                    </div>
                  </div>

                  {/* Recent Listings */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Recent Listings</h2>
                      <button
                        onClick={() => setActiveTab("listings")}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View all →
                      </button>
                    </div>
                    {listings.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {listings.slice(0, 6).map((product) => (
                          <div
                            key={product._id || product.id}
                            className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                          >
                            {product.images && product.images.length > 0 && (
                              <img
                                src={(product.images[0] || "").startsWith("http") ? product.images[0] : `http://127.0.0.1:8000/${product.images[0]}`}
                                alt={product.product_name}
                                className="w-full h-48 object-cover"
                              />
                            )}
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {product.product_name}
                              </h3>
                              <p className="text-lg font-bold text-gray-900 mt-2">
                                {formatCurrency(product.price)}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Stock: {product.stock || 0}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>No listings yet. Add your first product!</p>
                        <button
                          onClick={() => navigate("/sell")}
                          className="mt-4 text-blue-600 hover:text-blue-800"
                        >
                          Add Product →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Recent Orders */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
                      <button
                        onClick={() => setActiveTab("orders")}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View all →
                      </button>
                    </div>
                    {orders.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order ID
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {orders.slice(0, 5).map((order) => (
                              <tr key={order._id || order.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  #{order._id?.slice(-8) || order.id?.slice(-8) || "N/A"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {formatDate(order.created_at)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {formatCurrency(order.total || order.amount || 0)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      order.status === "completed" || order.status === "delivered"
                                        ? "bg-green-100 text-green-800"
                                        : order.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {order.status || "pending"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>No orders yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* My Listings Tab */}
              {activeTab === "listings" && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">📦 My Listings</h2>
                    <button
                      onClick={() => navigate("/sell")}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                      Add New Product
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading listings...</p>
                    </div>
                  ) : listings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {listings.map((product) => (
                        <div
                          key={product._id || product.id}
                          className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => navigate(`/product/${product._id ?? product.id}`)}
                        >
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={(product.images[0] || "").startsWith("http") ? product.images[0] : `http://127.0.0.1:8000/${product.images[0]}`}
                              alt={product.product_name}
                              className="w-full h-64 object-cover"
                            />
                          ) : (
                            <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                              <Package className="w-16 h-16 text-gray-400" />
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="font-semibold text-lg text-gray-900 truncate">
                              {product.product_name}
                            </h3>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                              {product.description || "No description"}
                            </p>
                            <div className="mt-4 flex items-center justify-between">
                              <p className="text-xl font-bold text-gray-900">
                                {formatCurrency(product.price)}
                              </p>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  product.stock > 0
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                              </span>
                            </div>
                            <div className="mt-2 text-sm text-gray-600">
                              Condition: {product.product_condition || "N/A"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg mb-2">No listings yet.</p>
                      <p className="mb-4">Start selling by adding your first product!</p>
                      <button
                        onClick={() => navigate("/sell")}
                        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Add Your First Product
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Earnings / Sales Tab */}
              {activeTab === "earnings" && (
                <div className="space-y-6">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading earnings...</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-lg shadow p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Products</p>
                              <p className="text-3xl font-bold text-gray-900 mt-2">
                                {stats?.total_products || 0}
                              </p>
                            </div>
                            <Package className="w-12 h-12 text-blue-500" />
                          </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Sales</p>
                              <p className="text-3xl font-bold text-gray-900 mt-2">
                                {stats?.total_sales || 0}
                              </p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-green-500" />
                          </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                              <p className="text-3xl font-bold text-gray-900 mt-2">
                                {formatCurrency(stats?.total_revenue || 0)}
                              </p>
                            </div>
                            <DollarSign className="w-12 h-12 text-yellow-500" />
                          </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Completed Orders</p>
                              <p className="text-3xl font-bold text-gray-900 mt-2">
                                {stats?.completed_orders || 0}
                              </p>
                            </div>
                            <ShoppingCart className="w-12 h-12 text-purple-500" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Sales Summary</h2>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-3 border-b">
                            <span className="text-gray-600">Pending Orders</span>
                            <span className="text-lg font-semibold text-gray-900">
                              {stats?.pending_orders || 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-3 border-b">
                            <span className="text-gray-600">Completed Orders</span>
                            <span className="text-lg font-semibold text-gray-900">
                              {stats?.completed_orders || 0}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-3">
                            <span className="text-gray-900 font-semibold">Total Revenue</span>
                            <span className="text-2xl font-bold text-green-600">
                              {formatCurrency(stats?.total_revenue || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === "orders" && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">📫 Orders</h2>
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => setOrderStatusFilter(e.target.value)}
                      className="border rounded-lg px-4 py-2 text-sm"
                    >
                      <option value="">All Orders</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading orders...</p>
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Order ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {orders.map((order) => (
                            <tr key={order._id || order.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                #{order._id?.slice(-8) || order.id?.slice(-8) || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {formatDate(order.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {order.buyer_name || order.buyer_id?.slice(-6) || "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatCurrency(order.total || order.amount || 0)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    order.status === "completed" || order.status === "delivered"
                                      ? "bg-green-100 text-green-800"
                                      : order.status === "pending"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : order.status === "processing"
                                      ? "bg-blue-100 text-blue-800"
                                      : order.status === "cancelled"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {order.status || "pending"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg mb-2">No orders found.</p>
                      {orderStatusFilter && (
                        <button
                          onClick={() => setOrderStatusFilter("")}
                          className="text-blue-600 hover:text-blue-800 mt-2"
                        >
                          Clear filter
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

