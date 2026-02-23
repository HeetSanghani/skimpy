import axios from "axios";
import { store } from "../app/store";

const BASE_URL = "https://skimpy-backend.onrender.com/payment";

// Helper to get token (optional if verification doesn't need auth, but good practice)
const getAuthHeader = () => {
    const state = store.getState();
    const token = state.auth?.token || localStorage.getItem("token");
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const verifyPaymentSession = async (sessionId) => {
    const response = await axios.post(`${BASE_URL}/verify-session`, { session_id: sessionId }, getAuthHeader());
    return response.data;
};
