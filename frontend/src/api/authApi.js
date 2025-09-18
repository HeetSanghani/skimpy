
import axios from "axios";
const BASE_URL = "http://127.0.0.1:8000"; // update if needed

export const sendOtp = async (email) => {
  return axios.post(`${BASE_URL}/auth/send-otp`, { email });
};

export const verifyOtp = async (email, otp) => {
  return axios.post(`${BASE_URL}/auth/verify-otp`, { email, otp });
};

export const registerUser = async (data) => {
  return axios.post(`${BASE_URL}/auth/register`, data);
};

export const loginUser = async (data) => {
  const formData = new URLSearchParams();
  formData.append("username", data.email);
  formData.append("password", data.password);

  return axios.post("http://127.0.0.1:8000/auth/login", formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};
