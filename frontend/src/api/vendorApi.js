import axios from "axios";

const BASE_URL = "";

export const createVendor = async ({ user_id, shop_name = "", shop_description = "", address = "", parent_id = "", file = null, token }) => {
  const form = new FormData();
  form.append("user_id", user_id || "");
  form.append("shop_name", shop_name || "");
  // keep legacy address and send new shop_description
  form.append("address", address || shop_description || "");
  form.append("shop_description", shop_description || address || "");
  form.append("parent_id", parent_id || "");
  if (file) form.append("file", file);

  const resolvedToken = token || localStorage.getItem("token");
  const headers = resolvedToken
    ? { Authorization: `Bearer ${resolvedToken}`, "Content-Type": "multipart/form-data" }
    : { "Content-Type": "multipart/form-data" };

  const res = await axios.post(`${BASE_URL}/Vendor`, form, { headers });
  return res.data;
};

export const updateVendor = async ({ vendor_id, user_id, shop_name = "", shop_description = "", address = "", parent_id = "", file = null, token }) => {
  const form = new FormData();
  form.append("vendor_id", vendor_id);
  form.append("user_id", user_id || "");
  form.append("shop_name", shop_name || "");
  form.append("address", address || shop_description || "");
  form.append("shop_description", shop_description || address || "");
  form.append("parent_id", parent_id || "");
  if (file) form.append("file", file);

  const resolvedToken = token || localStorage.getItem("token");
  const headers = resolvedToken
    ? { Authorization: `Bearer ${resolvedToken}`, "Content-Type": "multipart/form-data" }
    : { "Content-Type": "multipart/form-data" };

  const res = await axios.put(`${BASE_URL}/Vendor`, form, { headers });
  return res.data;
};

export const getVendorByUserId = async (user_id, token) => {
  const resolvedToken = token || localStorage.getItem("token");
  const headers = resolvedToken
    ? { Authorization: `Bearer ${resolvedToken}` }
    : {};
  // Use dedicated endpoint to fetch current user's vendor
  try {
    const res = await axios.get(`${BASE_URL}/Vendor/by-user`, { headers });
    return res.data;
  } catch (e) {
    // Fallback to list+filter if endpoint not available
    const res = await axios.get(`${BASE_URL}/Vendor/`, { headers });
    const vendors = res.data || [];
    return vendors.find(v => v.user_id === user_id);
  }
};


