import axios from "axios";

const BASE_URL = "http://localhost:8000";

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// Get cart items
export const getCartItems = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/cart`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching cart items:", error);
    throw error;
  }
};

// Add to cart
export const addToCart = async (productId, variantId = null, quantity = 1) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/cart`,
      {
        product_id: productId,
        variant_id: variantId,
        quantity: quantity,
      },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding to cart:", error);
    throw error;
  }
};

// Update cart item quantity
export const updateCartItemQuantity = async (cartItemId, quantity) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/cart/${cartItemId}`,
      {
        quantity: quantity,
      },
      {
        headers: getAuthHeaders(),
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating cart item:", error);
    throw error;
  }
};

// Remove from cart
export const removeFromCart = async (cartItemId) => {
  try {
    const response = await axios.delete(`${BASE_URL}/cart/${cartItemId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error removing from cart:", error);
    throw error;
  }
};

// Clear cart
export const clearCart = async () => {
  try {
    const response = await axios.delete(`${BASE_URL}/cart`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error clearing cart:", error);
    throw error;
  }
};

