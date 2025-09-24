import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000"; // 🔥 adjust if different

// Helper to get token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
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
