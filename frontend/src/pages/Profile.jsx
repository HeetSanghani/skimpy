import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAccountDetails,
  saveAccountDetails,
  removeAccount,
  fetchAddresses,
  addAddress,
  editAddress,
  removeAddress,
  fetchAvatar,
  uploadAvatar,
  removeAvatar,
  fetchCategories,
} from "../features/settings/settingsSlice";
import { sendOtpThunk, verifyOtpThunk } from "../features/auth/authSlice";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate, useLocation } from "react-router-dom";
import { createVendor, getVendorByUserId, updateVendor } from "../api/vendorApi";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("account");
  const [innerSellTab, setInnerSellTab] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    DOB: "",
    gender: "",
  });
  const [originalEmail, setOriginalEmail] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    street_address: "",
    city: "",
    postcode: "",
    state: "",
    country: "",
  });
  const [editId, setEditId] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { account, addresses, avatarUrl, categories, loading, error } =
    useSelector((state) => state.settings);

  console.log("Categories in Redux:", categories);

  /* ---------------- Load data on tab change ---------------- */
  useEffect(() => {
    // Support deep-linking to a specific tab (sell removed)
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["account", "delivery", "visibility"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (activeTab === "account") {
      dispatch(fetchAccountDetails()).then((res) => {
        if (fetchAccountDetails.fulfilled.match(res)) {
          setFormData(res.payload);
          setOriginalEmail(res.payload.email);
          // preload seller store fields if present
          if (res.payload?.store_name) setStoreName(res.payload.store_name);
          if (res.payload?.store_description) setStoreDescription(res.payload.store_description);
        }
      });
    } else if (activeTab === "delivery") {
      dispatch(fetchAddresses());
    } else if (activeTab === "visibility") {
      dispatch(fetchAvatar());
    }
  }, [activeTab, dispatch]);

  /* ---------------- Account ---------------- */
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = () => {
    if (formData.email !== originalEmail) {
      dispatch(sendOtpThunk(formData.email)).then((res) => {
        if (sendOtpThunk.fulfilled.match(res)) {
          alert("OTP sent to your new email");
          setShowOtpModal(true);
        }
      });
    } else {
      const payload =
        account?.role === "seller"
          ? { ...formData, store_name: storeName, store_description: storeDescription }
          : formData;
      dispatch(saveAccountDetails(payload)).then(async (res) => {
        if (saveAccountDetails.fulfilled.match(res)) {
          alert("Account updated successfully");
          setOriginalEmail(formData.email);
          setIsEditingEmail(false);

          // If seller, persist store info to vendor API (update or create)
          try {
            if ((account?.role === "seller") && (storeName || storeDescription)) {
              const userId = account?.user_id || account?._id || account?.id || "";
              const vendor = await getVendorByUserId(userId);
              if (vendor && vendor._id) {
                // Already exists, update
                await updateVendor({
                  vendor_id: vendor._id,
                  user_id: userId,
                  shop_name: storeName,
                  address: storeDescription,
                });
              } else {
                // Create new
                await createVendor({
                  user_id: userId,
                  shop_name: storeName,
                  address: storeDescription,
                });
              }
            }
          } catch(e) {
            console.error("Failed to save/update vendor info.", e);
          }
        }
      });
    }
  };

  const handleVerifyOtp = () => {
    dispatch(verifyOtpThunk({ email: formData.email, otp })).then((res) => {
      if (verifyOtpThunk.fulfilled.match(res)) {
        if (res.payload.success) {
          alert("Email verified successfully!");
          setShowOtpModal(false);

          dispatch(saveAccountDetails(formData)).then((res) => {
            if (saveAccountDetails.fulfilled.match(res)) {
              alert("Account updated successfully");
              setOriginalEmail(formData.email);
              setOtp("");
              setIsEditingEmail(false);
            }
          });
        } else {
          alert("Invalid OTP. Please try again.");
        }
      }
    });
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Delete account permanently?")) {
      dispatch(removeAccount()).then((res) => {
        if (removeAccount.fulfilled.match(res)) {
          alert("Account deleted");
          window.location.href = "/login";
        }
      });
    }
  };

  /* ---------------- Delivery ---------------- */
  const handleDeliveryChange = (e) =>
    setDeliveryForm({ ...deliveryForm, [e.target.name]: e.target.value });

  const handleSaveDelivery = () => {
    if (editId) {
      dispatch(editAddress({ id: editId, formData: deliveryForm })).then((res) => {
        if (editAddress.fulfilled.match(res)) {
          alert("Address updated");
          resetForm();
        }
      });
    } else {
      dispatch(addAddress(deliveryForm)).then((res) => {
        if (addAddress.fulfilled.match(res)) {
          alert("Address added");
          resetForm();
        }
      });
    }
  };

  const handleEditDelivery = (addr) => {
    setDeliveryForm(addr);
    setEditId(addr.address_id);
  };

  const handleDeleteDelivery = (id) => {
    dispatch(removeAddress(id)).then((res) => {
      if (removeAddress.fulfilled.match(res)) {
        alert("Address deleted");
      }
    });
  };

  const resetForm = () => {
    setDeliveryForm({
      first_name: "",
      last_name: "",
      phone: "",
      street_address: "",
      city: "",
      postcode: "",
      state: "",
      country: "",
    });
    setEditId(null);
  };

  /* ---------------- Avatar ---------------- */
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) dispatch(uploadAvatar(file));
  };

  const handleAvatarDelete = () => {
    if (window.confirm("Delete avatar?")) {
      dispatch(removeAvatar());
    }
  };

  /* ---------------- Tabs ---------------- */
  const tabs = [
    {
      id: "account",
      title: "Account Details",
      content: (
        <div className="space-y-4">
          {/* Account Fields */}
          <div className="grid grid-cols-2 gap-4">
            <input
              name="first_name"
              value={formData.first_name || ""}
              onChange={handleChange}
              placeholder="First Name"
              className="border rounded-lg p-2"
            />
            <input
              name="last_name"
              value={formData.last_name || ""}
              onChange={handleChange}
              placeholder="Last Name"
              className="border rounded-lg p-2"
            />
          </div>

          {/* Seller-only store fields */}
          {account?.role === "seller" && (
            <div className="grid grid-cols-2 gap-4">
              <input
                name="store_name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Store Name"
                className="border rounded-lg p-2"
              />
              <input
                name="store_description"
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                placeholder="Store Description"
                className="border rounded-lg p-2"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
              placeholder="Email"
              className={`border rounded-lg p-2 w-full ${
                !isEditingEmail ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
              readOnly={!isEditingEmail}
            />
            {!isEditingEmail ? (
              <button
                onClick={() => setIsEditingEmail(true)}
                className="px-3 py-1 bg-black text-white rounded"
              >
                Edit
              </button>
            ) : (
              <button
                onClick={() => {
                  setFormData({ ...formData, email: originalEmail });
                  setIsEditingEmail(false);
                }}
                className="px-3 py-1 bg-gray-500 text-white rounded"
              >
                Cancel
              </button>
            )}
          </div>

          <input
            name="phone"
            value={formData.phone || ""}
            onChange={handleChange}
            placeholder="Phone"
            className="border rounded-lg p-2 w-full"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              name="DOB"
              value={formData.DOB || ""}
              onChange={handleChange}
              className="border rounded-lg p-2"
            />
            <select
              name="gender"
              value={formData.gender || ""}
              onChange={handleChange}
              className="border rounded-lg p-2"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-black text-white rounded-lg"
            >
              Save
            </button>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-red-600 text-white rounded-lg"
            >
              Delete Account
            </button>
          </div>

          {/* OTP Modal */}
          {showOtpModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
                <h2 className="text-lg font-semibold mb-2">Verify Email</h2>
                <p className="mb-4">Enter the OTP sent to {formData.email}</p>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="border rounded-lg p-2 w-full mb-4"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setShowOtpModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyOtp}
                    className="px-4 py-2 bg-black text-white rounded-lg"
                  >
                    Verify & Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "delivery",
      title: "Delivery Addresses",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(deliveryForm)
              .filter((key) => key !== "address_id")
              .map((key) => (
                <input
                  key={key}
                  name={key}
                  value={deliveryForm[key] || ""}
                  onChange={handleDeliveryChange}
                  placeholder={key.replace("_", " ")}
                  className="border rounded-lg p-2"
                />
              ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveDelivery}
              className="px-4 py-2 bg-black text-white rounded-lg"
            >
              {editId ? "Update" : "Add"}
            </button>
            {editId && (
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </button>
            )}
          </div>

          {/* List */}
          {addresses.map((addr) => (
            <div
              key={addr.address_id}
              className="p-4 border rounded-lg flex justify-between cursor-pointer hover:bg-gray-100"
              onClick={() => {
                setSelectedAddress(addr);
                setShowAddressModal(true);
              }}
            >
              <div>
                <p>
                  {addr.first_name} {addr.last_name}
                </p>
                <p>{addr.phone}</p>
                <p>
                  {addr.street_address}, {addr.city}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditDelivery(addr);
                  }}
                  className="px-3 py-1 bg-black text-white rounded"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDelivery(addr.address_id);
                  }}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {/* Address Modal */}
          {showAddressModal && selectedAddress && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
              <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
                <h2 className="text-lg font-semibold mb-2">Delivery Address</h2>
                <p>
                  <strong>Name:</strong> {selectedAddress.first_name} {selectedAddress.last_name}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedAddress.phone}
                </p>
                <p>
                  <strong>Street Address:</strong> {selectedAddress.street_address}
                </p>
                <p>
                  <strong>City:</strong> {selectedAddress.city}
                </p>
                <p>
                  <strong>State:</strong> {selectedAddress.state}
                </p>
                <p>
                  <strong>Postcode:</strong> {selectedAddress.postcode}
                </p>
                <p>
                  <strong>Country:</strong> {selectedAddress.country}
                </p>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setShowAddressModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: "visibility",
      title: "Profile Avatar",
      content: (
        <div>
          {avatarUrl ? (
            <div>
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover"
              />
              <div className="flex gap-2 mt-2">
                <label className="bg-black text-white px-3 py-1 rounded cursor-pointer">
                  Change
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
                <button
                  onClick={handleAvatarDelete}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <label className="bg-black text-white px-3 py-1 rounded cursor-pointer">
              Upload Avatar
              <input
                type="file"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </label>
          )}
        </div>
      ),
    },

    // Sell tab removed
  ];

  return (
    <>
      <Navbar />
      <div className="flex">
        {/* Sidebar */}
        <div className="w-1/4 border-r p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`block w-full text-left p-2 rounded ${
                activeTab === tab.id ? "bg-black text-white" : "hover:bg-gray-200"
              }`}
            >
              {tab.title}
            </button>
          ))}

          {account?.role === "seller" && (
            <button
              onClick={() => navigate("/seller/dashboard")}
              className="block w-full text-left p-2 rounded hover:bg-gray-200"
            >
              Seller Dashboard
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to logout?")) {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }
            }}
            className="block w-full text-left p-2 text-black rounded mt-4 hover:bg-gray-200 transition"
          >
            Logout
          </button>
        </div>

        {/* Content */}
        <div className="w-3/4 p-6">
          {tabs.find((t) => t.id === activeTab)?.content}
        </div>
      </div>
      {/* <Footer /> */}
    </>
  );
}
