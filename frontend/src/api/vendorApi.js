import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000";

export const createVendor = async ({ user_id, shop_name = "", address = "", parent_id = "", file = null, token }) => {
  const form = new FormData();
  form.append("user_id", user_id || "");
  form.append("shop_name", shop_name || "");
  form.append("address", address || "");
  form.append("parent_id", parent_id || "");
  if (file) form.append("file", file);

  const headers = token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
    : { "Content-Type": "multipart/form-data" };

  const res = await axios.post(`${BASE_URL}/Vendor`, form, { headers });
  return res.data; // expects vendor with _id
};


