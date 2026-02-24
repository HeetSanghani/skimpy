import axios from "axios";
import { API_BASE_URL } from "./baseUrl";

const BASE_URL = API_BASE_URL;

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
