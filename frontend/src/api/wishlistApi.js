import axios from "axios";
import { API_BASE_URL } from "./baseUrl";

const BASE_URL = API_BASE_URL;

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Get wishlist items
export const getWishlistItems = async () => {
  try {
    const response = await axios.get(`${BASE_URL}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching wishlist items:", error);
    throw error;
  }
};

// Add to wishlist
export const addToWishlist = async (productId, variantId = null) => {
  try {
    const response = await axios.post(
      `${BASE_URL}`,
      {
        product_id: productId,
        variant_id: variantId,
      },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    throw error;
  }
};

// Remove from wishlist
export const removeFromWishlist = async (wishlistItemId) => {
  try {
    const response = await axios.delete(`${BASE_URL}/${wishlistItemId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    throw error;
  }
};

// Check if product is in wishlist
export const checkWishlist = async (productId, variantId = null) => {
  try {
    let url = `${BASE_URL}/check/${productId}`;
    if (variantId) {
      url += `?variant_id=${variantId}`;
    }
    const response = await axios.get(url, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error checking wishlist:", error);
    return { in_wishlist: false };
  }
};

