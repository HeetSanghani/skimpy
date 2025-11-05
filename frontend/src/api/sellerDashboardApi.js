import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

// Get authentication token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// 📦 Get My Listings
export const getMyListings = async (limit = 50, skip = 0) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/seller/dashboard/listings?limit=${limit}&skip=${skip}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching listings:", error);
    throw error;
  }
};

// 💰 Get Earnings / Sales Stats
export const getEarningsStats = async () => {
  try {
    const response = await axios.get(
      `${BASE_URL}/seller/dashboard/earnings`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching earnings:", error);
    throw error;
  }
};

// 📫 Get Orders
export const getOrders = async (status = null, limit = 50, skip = 0) => {
  try {
    let url = `${BASE_URL}/seller/dashboard/orders?limit=${limit}&skip=${skip}`;
    if (status) {
      url += `&status=${status}`;
    }
    const response = await axios.get(url, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

// 📊 Get Complete Dashboard (All in one)
export const getDashboard = async (listingsLimit = 10, ordersLimit = 10) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/seller/dashboard?listings_limit=${listingsLimit}&orders_limit=${ordersLimit}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    throw error;
  }
};

