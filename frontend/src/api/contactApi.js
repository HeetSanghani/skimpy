import axios from "axios";

// Access the VITE_BASE_URL env var or fallback
const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8000";

/**
 * Send a contact message
 * @param {Object} data - { name, email, subject, message, category }
 */
export const sendContactMessage = async (data) => {
  try {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await axios.post(`${BASE_URL}/contact/`, data, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error sending contact message:", error);
    throw error;
  }
};
