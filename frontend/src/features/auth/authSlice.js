
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { 
  loginUser, 
  sendOtp, 
  verifyOtp, 
  registerUser, 
  forgotPassword, 
  resetPassword  
} from "../../api/authApi";

/* ----------------- Async Thunks ----------------- */

// login
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginUser(credentials);
      localStorage.setItem("token", response.data.access_token);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Login failed");
    }
  }
);

// send OTP
export const sendOtpThunk = createAsyncThunk(
  "auth/sendOtp",
  async (email, { rejectWithValue }) => {
    try {
      const res = await sendOtp(email);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to send OTP");
    }
  }
);

// verify OTP
export const verifyOtpThunk = createAsyncThunk(
  "auth/verifyOtp",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const res = await verifyOtp(email, otp);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "OTP verification failed");
    }
  }
);

// register
export const registerThunk = createAsyncThunk(
  "auth/register",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await registerUser(formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Registration failed");
    }
  }
);

// forgot password
export const forgotPasswordThunk = createAsyncThunk(
  "auth/forgotPassword",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await forgotPassword(formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to reset password");
    }
  }
);

// reset password (logged-in user)
export const resetPasswordThunk = createAsyncThunk(
  "auth/resetPasswordLoggedIn",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await resetPassword(formData);
      return res.data; // backend success message
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || "Failed to reset password");
    }
  }
);

/* ----------------- Slice ----------------- */

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: localStorage.getItem("token") || null,
    loading: false,
    error: null,
    otpSent: false,
    otpVerified: false,
    resetSuccess: false, // ✅ added
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
    },
    resetOtpFlow: (state) => {
      state.otpSent = false;
      state.otpVerified = false;
    },
    resetAuthState: (state) => {
      state.error = null;
      state.resetSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      /* login */
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access_token;
        state.user = action.payload.user || null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* sendOtp */
      .addCase(sendOtpThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOtpThunk.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = true;
      })
      .addCase(sendOtpThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* verifyOtp */
      .addCase(verifyOtpThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtpThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.otpVerified = action.payload.success;
      })
      .addCase(verifyOtpThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* register */
      .addCase(registerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* forgotPassword */
      .addCase(forgotPasswordThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPasswordThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotPasswordThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* resetPassword (logged-in user) */
      .addCase(resetPasswordThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.resetSuccess = false;
      })
      .addCase(resetPasswordThunk.fulfilled, (state) => {
        state.loading = false;
        state.resetSuccess = true;
      })
      .addCase(resetPasswordThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.resetSuccess = false;
      });
  },
});

export const { logout, resetOtpFlow, resetAuthState } = authSlice.actions;
export default authSlice.reducer;
