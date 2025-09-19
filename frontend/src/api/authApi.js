
// import axios from "axios";
// const BASE_URL = "http://127.0.0.1:8000"; // update if needed

// export const sendOtp = async (email) => {
//   return axios.post(`${BASE_URL}/auth/send-otp`, { email });
// };

// export const verifyOtp = async (email, otp) => {
//   return axios.post(`${BASE_URL}/auth/verify-otp`, { email, otp });
// };

// export const registerUser = async (data) => {
//   return axios.post(`${BASE_URL}/auth/register`, data);
// };

// export const loginUser = async (data) => {
//   const formData = new URLSearchParams();
//   formData.append("username", data.email);
//   formData.append("password", data.password);

//   return axios.post("http://127.0.0.1:8000/auth/login", formData, {
//     headers: { "Content-Type": "application/x-www-form-urlencoded" },
//   });
// };






// authApi.js
import axios from "axios";
const BASE_URL = "http://127.0.0.1:8000"; // update if needed

export const sendOtp = async (email) => {
  return axios.post(`${BASE_URL}/auth/send-otp`, { email });
};

export const verifyOtp = async (email, otp) => {
  try {
    const response = await axios.post(`${BASE_URL}/auth/verify-otp`, { email, otp: otp.trim() });
    // console.log("verifyOtp response:", response.data);
    return response;
  } catch (error) {
    console.error("Error verifying OTP:", error.response?.data || error);
    throw error;
  }
};

export const registerUser = async (data) => {
  return axios.post(`${BASE_URL}/auth/register`, data);
};

export const loginUser = async (data) => {
  const formData = new URLSearchParams();
  formData.append("username", data.email);
  formData.append("password", data.password);

  return axios.post(`${BASE_URL}/auth/login`, formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
};

export const getUserProfile = async (token) => {
  try {
    const response = await axios.get(`${BASE_URL}/user/getprofile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response; // caller can access response.data
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

// // ✅ Update user profile (with file upload)
// export const updateUserProfile = async (data, token) => {
  
//   return axios.put(`${BASE_URL}/user/profile`, data, {
//     headers: {
//       Authorization: `Bearer ${token}`,
//       "Content-Type": "multipart/form-data",
//     },
//   });
// };



export const updateUserProfile = async (data) => {
  const token = localStorage.getItem("token"); // get token after login
  return axios.put(`${BASE_URL}/user/profile`, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
};


// ✅ Reset Password API
export const resetPassword = async (data) => {
  const token = localStorage.getItem("token");
  return axios.post(`${BASE_URL}/auth/reset-password`, data, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // if your backend requires login
    },
  });
};


export const forgotPassword = async (data) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${BASE_URL}/auth/verify-forgot-otp`, data, {
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${token}`, // only if required
      },
    });
    // show success message
    alert(response.data.message);
    return response.data;
  } catch (error) {
    if (error.response) {
      alert(error.response.data.detail || "Something went wrong");
    } else {
      alert("Server not reachable");
    }
    throw error;
  }
};