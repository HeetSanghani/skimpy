import axios from "axios";
import { store } from "../app/store"; // Corrected named import

const BASE_URL = "https://skimpy-backend.onrender.com/orders";

// Helper to get token
const getAuthHeader = () => {
    const state = store.getState();
    const token = state.auth?.token || localStorage.getItem("token");
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const createOrderFromCart = async (shippingAddress, paymentId) => {
    const headers = getAuthHeader();
    if (!headers.headers) throw new Error("Not authenticated");
    
    const response = await axios.post(`${BASE_URL}/create-from-cart`, {
        shipping_address: shippingAddress,
        payment_id: paymentId
    }, headers);
    return response.data;
};

export const getUserOrders = async (limit = 20, skip = 0) => {
    const headers = getAuthHeader();
    if (!headers.headers) throw new Error("Not authenticated");

    const response = await axios.get(`${BASE_URL}/user?limit=${limit}&skip=${skip}`, headers);
    return response.data;
};

export const getOrderById = async (orderId) => {
    const headers = getAuthHeader();
    if (!headers.headers) throw new Error("Not authenticated");

    const response = await axios.get(`${BASE_URL}/${orderId}`, headers);
    return response.data;
};

export const getVendorOrders = async (limit = 20, skip = 0) => {
    const headers = getAuthHeader();
    if (!headers.headers) return []; // Should handle error appropriately or return empty

    const response = await axios.get(`${BASE_URL}/vendor?limit=${limit}&skip=${skip}`, headers);
    return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
    const response = await axios.put(`${BASE_URL}/${orderId}/status`, { status }, getAuthHeader());
    return response.data;
};
