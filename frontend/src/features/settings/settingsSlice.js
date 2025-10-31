import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getAccountDetails,
  updateAccountDetails,
  deleteAccount,
  getDeliveryAddresses,
  addDeliveryAddress,
  updateDeliveryAddress,
  deleteDeliveryAddress,
  getProfileAvatar,
  addProfileAvatar,
  deleteProfileAvatar,
  fetchAllCategories,
} from "../../api/settingsApi";

/* ---------------- ACCOUNT ---------------- */
export const fetchAccountDetails = createAsyncThunk(
  "settings/fetchAccountDetails",
  async (_, { rejectWithValue }) => {
    try {
      return await getAccountDetails();
    } catch (err) {
      return rejectWithValue(err.detail || "Failed to load account details");
    }
  }
);

export const saveAccountDetails = createAsyncThunk(
  "settings/saveAccountDetails",
  async (formData, { rejectWithValue }) => {
    try {
      return await updateAccountDetails(formData);
    } catch (err) {
      return rejectWithValue(err.detail || "Failed to update account");
    }
  }
);

export const removeAccount = createAsyncThunk(
  "settings/removeAccount",
  async (_, { rejectWithValue }) => {
    try {
      await deleteAccount();
      localStorage.removeItem("token");
      return true;
    } catch (err) {
      return rejectWithValue(err.detail || "Failed to delete account");
    }
  }
);

/* ---------------- DELIVERY ---------------- */
export const fetchAddresses = createAsyncThunk(
  "settings/fetchAddresses",
  async (_, { rejectWithValue }) => {
    try {
      return await getDeliveryAddresses();
    } catch (err) {
      return rejectWithValue(err.detail || "Failed to load addresses");
    }
  }
);

export const addAddress = createAsyncThunk(
  "settings/addAddress",
  async (formData, { rejectWithValue }) => {
    try {
      return await addDeliveryAddress(formData);
    } catch (err) {
      return rejectWithValue(err.detail || "Failed to add address");
    }
  }
);

export const editAddress = createAsyncThunk(
  "settings/editAddress",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      return await updateDeliveryAddress(id, formData);
    } catch (err) {
      return rejectWithValue(err.detail || "Failed to update address");
    }
  }
);

export const removeAddress = createAsyncThunk(
  "settings/removeAddress",
  async (id, { rejectWithValue }) => {
    try {
      await deleteDeliveryAddress(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.detail || "Failed to delete address");
    }
  }
);

/* ---------------- AVATAR ---------------- */
export const fetchAvatar = createAsyncThunk(
  "settings/fetchAvatar",
  async (_, { rejectWithValue }) => {
    try {
      return await getProfileAvatar();
    } catch (err) {
      return rejectWithValue(err.detail || "Failed to load avatar");
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  "settings/uploadAvatar",
  async (file, { rejectWithValue }) => {
    try {
      return await addProfileAvatar(file);
    } catch (err) {
      return rejectWithValue(err.detail || "Failed to upload avatar");
    }
  }
);

export const removeAvatar = createAsyncThunk(
  "settings/removeAvatar",
  async (_, { rejectWithValue }) => {
    try {
      await deleteProfileAvatar();
      return null;
    } catch (err) {
      return rejectWithValue(err.detail || "Failed to delete avatar");
    }
  }
);

export const fetchCategories = createAsyncThunk(
  "settings/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAllCategories();
    } catch (err) {
      return rejectWithValue(err.detail || "Failed to load categories");
    }
  }
);

// ✅ New: fetch subcategories by parent id
import { fetchSubcategoriesByParentId } from "../../api/settingsApi";
export const fetchSubcategories = createAsyncThunk(
  "settings/fetchSubcategories",
  async (parentId, { rejectWithValue }) => {
    try {
      return await fetchSubcategoriesByParentId(parentId);
    } catch (err) {
      return rejectWithValue(err.detail || "Failed to load subcategories");
    }
  }
);

/* ---------------- SLICE ---------------- */
const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    account: null,
    addresses: [],
    avatarUrl: null,
    categories: [],
    subcategories: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetSettings: (state) => {
      state.account = null;
      state.addresses = [];
      state.avatarUrl = null;
      state.categories = [];
      state.subcategories = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      /* account */
      .addCase(fetchAccountDetails.fulfilled, (state, action) => {
        state.account = action.payload;
      })
      .addCase(saveAccountDetails.fulfilled, (state, action) => {
        state.account = action.payload;
      })
      .addCase(removeAccount.fulfilled, (state) => {
        state.account = null;
        state.addresses = [];
        state.avatarUrl = null;
      })

      /* addresses */
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.addresses = action.payload;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.addresses.push(action.payload);
      })
      .addCase(editAddress.fulfilled, (state, action) => {
        state.addresses = state.addresses.map((addr) =>
          addr.address_id === action.payload.address_id ? action.payload : addr
        );
      })
      .addCase(removeAddress.fulfilled, (state, action) => {
        state.addresses = state.addresses.filter(
          (addr) => addr.address_id !== action.payload
        );
      })

      /* avatar */
      .addCase(fetchAvatar.fulfilled, (state, action) => {
        state.avatarUrl = action.payload.avatar_url;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.avatarUrl = action.payload.avatar_url;
      })
      .addCase(removeAvatar.fulfilled, (state) => {
        state.avatarUrl = null;
      })

      /* Categories */
      .addCase(fetchCategories.fulfilled, (state, action) => {
        console.log("✅ Redux: categories updated:", action.payload);
        state.categories = action.payload;
      })
      /* Subcategories */
      .addCase(fetchSubcategories.fulfilled, (state, action) => {
        state.subcategories = action.payload;
      })

      /* handle pending/error */
      .addMatcher((action) => action.type.endsWith("/pending"), (state) => {
        state.loading = true;
        state.error = null;
      })
      .addMatcher((action) => action.type.endsWith("/fulfilled"), (state) => {
        state.loading = false;
      })
      .addMatcher((action) => action.type.endsWith("/rejected"), (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
