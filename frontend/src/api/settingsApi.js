import axios from "axios";

const BASE_URL = "https://skimpy-backend.onrender.com"; // Proxy handles prefix

// Helper to get token
// Helper to get token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) {
      // Return empty or throw, but better to return empty object so axios doesn't send bad header
      // However, for protected routes we want to ensure we don't make the request at all if possible,
      // but simpler here is to not send Authorization header if null.
      return { 
          "Content-Type": "application/json" 
      };
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// ✅ Get account details
export const getAccountDetails = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/user/settings/get-account-details`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// ✅ Update account details
export const updateAccountDetails = async (data) => {
  try {
    const res = await axios.put(`${BASE_URL}/user/settings/account-details`, data, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};

// ✅ Delete account
export const deleteAccount = async () => {
  try {
    const res = await axios.delete(`${BASE_URL}/user/settings/delete-account`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (err) {
    throw err.response?.data || err;
  }
};




// ✅ Get all delivery addresses
export const getDeliveryAddresses = async () => {
  const res = await axios.get(`${BASE_URL}/user/settings/get-delivery-address`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// ✅ Add delivery address
export const addDeliveryAddress = async (data) => {
  const res = await axios.post(`${BASE_URL}/user/settings/add-delivery-address`, data, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// ✅ Update delivery address
export const updateDeliveryAddress = async (addressId, data) => {
  const res = await axios.put(
    `${BASE_URL}/user/settings/update-delivery-address`,
    data,
    { 
      headers: getAuthHeaders(),
      params: { address_id: addressId } // ✅ send as query param
    }
  );
  return res.data;
};


// ✅ Delete delivery address
export const deleteDeliveryAddress = async (addressId) => {
  console.log("Deleting addressId:", addressId); // debug
  const res = await axios.delete(
    `${BASE_URL}/user/settings/delete-delivery-address`,
    {
      headers: getAuthHeaders(),
      params: { address_id: addressId }, // 👈 must be inside config
    }
  );
  console.log("Final request URL:", res.config.url); 
  return res.data;
};



// // ----------------- PROFILE AVATAR APIS -----------------

// ✅ Get Profile Avatar
export const getProfileAvatar = async () => {
  const res = await axios.get(`${BASE_URL}/user/settings/get-profile-avatar`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

// ✅ Add Profile Avatar
export const addProfileAvatar = async (file) => {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await axios.put(`${BASE_URL}/user/settings/add-profile-avatar`, formData, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// ✅ Delete Profile Avatar
export const deleteProfileAvatar = async () => {
  const res = await axios.delete(`${BASE_URL}/user/settings/delete-profile-avatar`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};



export const fetchAllCategories = async () => {
  try {
    console.log("🟢 Calling GET /Category API...");
    const res = await axios.get(`${BASE_URL}/Category`, {
      params: { parent_only: false },
    });
    console.log("✅ Response from /Category:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching categories:", error.response?.data || error);
    throw error; // ❗ throw so that Redux knows it's failed
  }
};

// ✅ Get subcategories by parent category id (includes recursive children per backend)
export const fetchSubcategoriesByParentId = async (parentId) => {
  try {
    if (!parentId) throw new Error("parentId is required");
    const res = await axios.get(`${BASE_URL}/Category/`, {
      params: { category_id: parentId },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching subcategories:", error.response?.data || error);
    throw error;
  }
};

// ----------------- PRODUCT APIS -----------------

// ✅ Create Product
export const createProduct = async (formData) => {
  try {
    const res = await axios.post(`${BASE_URL}/Product`, formData, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Error creating product:", error.response?.data || error);
    throw error;
  }
};

// ✅ Get all products
export const fetchAllProducts = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/Product/`);
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching products:", error.response?.data || error);
    throw error;
  }
};

// ✅ Get single product
export const fetchProductById = async (productId) => {
  try {
    const res = await axios.get(`${BASE_URL}/Product/${productId}`);
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching product:", error.response?.data || error);
    throw error;
  }
};

// ✅ Update product
export const updateProduct = async (productId, formData) => {
  try {
    const res = await axios.put(`${BASE_URL}/Product/${productId}`, formData, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Error updating product:", error.response?.data || error);
    throw error;
  }
};

// ✅ Delete product
export const deleteProduct = async (productId) => {
  try {
    const res = await axios.delete(`${BASE_URL}/Product/${productId}`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("❌ Error deleting product:", error.response?.data || error);
    throw error;
  }
};

// ----------------- ATTRIBUTE APIS -----------------

// ✅ Get all attributes with their values
export const fetchAllAttributes = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/Attribute/`);
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching attributes:", error.response?.data || error);
    throw error;
  }
};

// ✅ Get all attribute values
export const fetchAllAttributeValues = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/AttributeValue/`);
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching attribute values:", error.response?.data || error);
    throw error;
  }
};

// ✅ Get attributes with their values
export const fetchAttributesWithValues = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/AttributeValue/with_attributes/all`);
    return res.data;
  } catch (error) {
    console.error("❌ Error fetching attributes with values:", error.response?.data || error);
    throw error;
  }
};

// ----------------- VARIANT APIS -----------------

// ✅ Update Variant
export const updateVariant = async (variantId, formData) => {
  try {
    const res = await axios.put(`${BASE_URL}/Variant/update/${variantId}`, formData, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    console.error("❌ Error updating variant:", error.response?.data || error);
    throw error;
  }
};

// ✅ Delete Variant
export const deleteVariant = async (variantId) => {
  try {
    const res = await axios.delete(`${BASE_URL}/Variant/delete/${variantId}`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    console.error("❌ Error deleting variant:", error.response?.data || error);
    throw error;
  }
};