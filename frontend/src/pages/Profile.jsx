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
import { useConfirmation } from "../context/ConfirmationContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate, useLocation } from "react-router-dom";
import toast from 'react-hot-toast';
import { createVendor, getVendorByUserId, updateVendor } from "../api/vendorApi";
import {
  User, MapPin, Image as ImageIcon, LayoutDashboard,
  Info, Mail, Phone, LogOut, Pencil, Trash2, X, Check, Upload, ChevronRight
} from "lucide-react";

// ── Shared input class ──────────────────────────────────────────────────────
const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/40 transition-all duration-200";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("account");
  const [innerSellTab, setInnerSellTab] = useState(null);
  const [formData, setFormData] = useState({
    first_name: "", last_name: "", email: "", phone: "", DOB: "", gender: "",
  });
  const [originalEmail, setOriginalEmail] = useState("");
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    first_name: "", last_name: "", phone: "", street_address: "",
    city: "", postcode: "", state: "", country: "",
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

  /* ── Load data on tab change ── */
  useEffect(() => {
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
          if (res.payload?.shop_name || res.payload?.store_name)
            setStoreName(res.payload.shop_name ?? res.payload.store_name);
          if (res.payload?.shop_description || res.payload?.store_description)
            setStoreDescription(res.payload.shop_description ?? res.payload.store_description);
        }
      });
    } else if (activeTab === "delivery") {
      dispatch(fetchAddresses());
    } else if (activeTab === "visibility") {
      dispatch(fetchAvatar());
    }
  }, [activeTab, dispatch]);

  /* ── Account ── */
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = () => {
    if (formData.email !== originalEmail) {
      dispatch(sendOtpThunk(formData.email)).then((res) => {
        if (sendOtpThunk.fulfilled.match(res)) {
          toast.success("OTP sent to your new email");
          setShowOtpModal(true);
        }
      });
    } else {
      const payload =
        account?.role === "seller"
          ? { ...formData, shop_name: storeName, shop_description: storeDescription }
          : formData;
      dispatch(saveAccountDetails(payload)).then(async (res) => {
        if (saveAccountDetails.fulfilled.match(res)) {
          toast.success("Account updated successfully");
          setOriginalEmail(formData.email);
          setIsEditingEmail(false);
          try {
            if ((account?.role === "seller") && (storeName || storeDescription)) {
              const userId = account?.user_id || account?._id || account?.id || "";
              const vendor = await getVendorByUserId(userId);
              if (vendor && vendor._id) {
                await updateVendor({ vendor_id: vendor._id, user_id: userId, shop_name: storeName, shop_description: storeDescription });
              } else {
                await createVendor({ user_id: userId, shop_name: storeName, shop_description: storeDescription });
              }
            }
          } catch (e) { console.error("Failed to save/update vendor info.", e); }
        }
      });
    }
  };

  const handleVerifyOtp = () => {
    dispatch(verifyOtpThunk({ email: formData.email, otp })).then((res) => {
      if (verifyOtpThunk.fulfilled.match(res)) {
        if (res.payload.success) {
          toast.success("Email verified successfully!");
          setShowOtpModal(false);
          dispatch(saveAccountDetails(formData)).then((res) => {
            if (saveAccountDetails.fulfilled.match(res)) {
              toast.success("Account updated successfully");
              setOriginalEmail(formData.email);
              setOtp("");
              setIsEditingEmail(false);
            }
          });
        } else { toast.error("Invalid OTP. Please try again."); }
      }
    });
  };

  const { showConfirm } = useConfirmation();

  const handleDeleteAccount = () => {
    showConfirm({
      title: "Delete Account",
      message: "Are you sure you want to permanently delete your account? This action cannot be undone.",
      confirmText: "Delete Account",
      type: "danger",
      onConfirm: () => {
        dispatch(removeAccount()).then((res) => {
          if (removeAccount.fulfilled.match(res)) {
            // alert("Account deleted"); // Replace alert with toast if possible, or just redirect
            window.location.href = "/login";
          }
        });
      }
    });
  };

  /* ── Delivery ── */
  const handleDeliveryChange = (e) => setDeliveryForm({ ...deliveryForm, [e.target.name]: e.target.value });

  const handleSaveDelivery = () => {
    if (editId) {
      dispatch(editAddress({ id: editId, formData: deliveryForm })).then((res) => {
        if (editAddress.fulfilled.match(res)) { toast.success("Address updated"); resetForm(); }
      });
    } else {
      dispatch(addAddress(deliveryForm)).then((res) => {
        if (addAddress.fulfilled.match(res)) { toast.success("Address added"); resetForm(); }
      });
    }
  };

  const handleEditDelivery = (addr) => { setDeliveryForm(addr); setEditId(addr.address_id); };
  const handleDeleteDelivery = (id) => {
    dispatch(removeAddress(id)).then((res) => {
      if (removeAddress.fulfilled.match(res)) toast.success("Address deleted");
    });
  };
  const resetForm = () => {
    setDeliveryForm({ first_name: "", last_name: "", phone: "", street_address: "", city: "", postcode: "", state: "", country: "" });
    setEditId(null);
  };

  /* ── Avatar ── */
  const handleAvatarUpload = (e) => { const file = e.target.files[0]; if (file) dispatch(uploadAvatar(file)); };

  const handleAvatarDelete = () => {
    showConfirm({
      title: "Remove Avatar",
      message: "Are you sure you want to remove your profile picture?",
      confirmText: "Remove",
      type: "danger",
      onConfirm: () => dispatch(removeAvatar())
    });
  };

  /* ── Sidebar nav items ── */
  const navItems = [
    { id: "account", label: "Account Details", icon: User },
    { id: "delivery", label: "Delivery Addresses", icon: MapPin },
    { id: "visibility", label: "Profile Avatar", icon: ImageIcon },
  ];

  /* ── Field label helper ── */
  const fieldLabel = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  /* ── Tab content ── */
  const renderContent = () => {
    if (activeTab === "account") return (
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Account Details</h2>
          <p className="text-gray-400 text-sm">Manage your personal information</p>
        </div>

        {/* Name row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">First Name</label>
            <input name="first_name" value={formData.first_name || ""} onChange={handleChange} placeholder="First Name" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Last Name</label>
            <input name="last_name" value={formData.last_name || ""} onChange={handleChange} placeholder="Last Name" className={inputCls} />
          </div>
        </div>

        {/* Seller store fields */}
        {account?.role === "seller" && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Store Name</label>
              <input name="store_name" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Your store name" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Store Description</label>
              <textarea
                name="store_description"
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                placeholder="Tell customers what your store is about…"
                rows={4}
                className={`${inputCls} resize-none leading-relaxed`}
              />
            </div>
          </>
        )}

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
          <div className="flex items-center gap-2">
            <input
              name="email" value={formData.email || ""} onChange={handleChange} placeholder="Email"
              type="email"
              className={`${inputCls} flex-1 ${!isEditingEmail ? "opacity-60 cursor-not-allowed" : ""}`}
              readOnly={!isEditingEmail}
            />
            {!isEditingEmail ? (
              <button onClick={() => setIsEditingEmail(true)} className="flex items-center gap-1.5 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all duration-200">
                <Pencil size={14} /> Edit
              </button>
            ) : (
              <button onClick={() => { setFormData({ ...formData, email: originalEmail }); setIsEditingEmail(false); }} className="flex items-center gap-1.5 px-4 py-3 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl transition-all duration-200">
                <X size={14} /> Cancel
              </button>
            )}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Phone (10 digits)</label>
          <input
            name="phone"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={formData.phone || ""}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
              setFormData({ ...formData, phone: digits });
            }}
            placeholder="9876543210"
            className={inputCls}
          />
          {formData.phone && !/^\d{10}$/.test(formData.phone) && (
            <p className="mt-1 text-xs text-red-400">Phone must be exactly 10 digits</p>
          )}
        </div>

        {/* DOB + Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Date of Birth</label>
            <input type="date" name="DOB" value={formData.DOB || ""} onChange={handleChange}
              className={`${inputCls} [color-scheme:dark]`} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Gender</label>
            <div className="relative">
              <select name="gender" value={formData.gender || ""} onChange={handleChange}
                className={`${inputCls} appearance-none pr-10 cursor-pointer`}
                style={{ colorScheme: "dark", backgroundColor: "rgba(255,255,255,0.05)" }}>
                <option value="" style={{ background: "#1e1b2e", color: "#9ca3af" }}>Select Gender</option>
                <option value="male" style={{ background: "#1e1b2e", color: "#fff" }}>Male</option>
                <option value="female" style={{ background: "#1e1b2e", color: "#fff" }}>Female</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/20">
            <Check size={16} /> Save Changes
          </button>
          <button onClick={handleDeleteAccount} className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold rounded-xl transition-all duration-200">
            <Trash2 size={16} /> Delete Account
          </button>
        </div>

        {/* OTP Modal */}
        {showOtpModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-8 w-96 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-1">Verify Email</h2>
              <p className="text-gray-400 text-sm mb-5">Enter the OTP sent to <span className="text-indigo-400">{formData.email}</span></p>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP"
                className={`${inputCls} mb-5 tracking-[0.3em] text-center text-lg`} />
              <div className="flex gap-3">
                <button onClick={() => setShowOtpModal(false)} className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all">Cancel</button>
                <button onClick={handleVerifyOtp} className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all">Verify & Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );

    if (activeTab === "delivery") return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Delivery Addresses</h2>
          <p className="text-gray-400 text-sm">{editId ? "Edit your address" : "Add a new delivery address"}</p>
        </div>

        {/* Address form — fully typed fields */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* First Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">First Name</label>
              <input type="text" name="first_name" value={deliveryForm.first_name || ""}
                onChange={handleDeliveryChange} placeholder="First Name" className={inputCls} />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Last Name</label>
              <input type="text" name="last_name" value={deliveryForm.last_name || ""}
                onChange={handleDeliveryChange} placeholder="Last Name" className={inputCls} />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Phone (10 digits)</label>
              <input
                type="tel" name="phone" inputMode="numeric" maxLength={10}
                value={deliveryForm.phone || ""}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                placeholder="9876543210" className={inputCls}
              />
              {deliveryForm.phone && !/^\d{10}$/.test(deliveryForm.phone) && (
                <p className="mt-1 text-xs text-red-400">Must be 10 digits</p>
              )}
            </div>

            {/* PIN Code */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">PIN Code (6 digits)</label>
              <input
                type="text" name="postcode" inputMode="numeric" maxLength={6}
                value={deliveryForm.postcode || ""}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, postcode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                placeholder="395001" className={inputCls}
              />
              {deliveryForm.postcode && !/^\d{6}$/.test(deliveryForm.postcode) && (
                <p className="mt-1 text-xs text-red-400">PIN must be 6 digits</p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">City</label>
              <input type="text" name="city" value={deliveryForm.city || ""}
                onChange={handleDeliveryChange} placeholder="Surat" className={inputCls} />
            </div>

            {/* State */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">State</label>
              <input type="text" name="state" value={deliveryForm.state || ""}
                onChange={handleDeliveryChange} placeholder="Gujarat" className={inputCls} />
            </div>

            {/* Country */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Country</label>
              <input type="text" name="country" value={deliveryForm.country || ""}
                onChange={handleDeliveryChange} placeholder="India" className={inputCls} />
            </div>

            {/* Street Address — full width */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Street Address</label>
              <textarea name="street_address" rows={2} value={deliveryForm.street_address || ""}
                onChange={handleDeliveryChange} placeholder="House / Flat, Building, Street, Area"
                className={`${inputCls} resize-none`} />
            </div>

          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => {
                // Validate before save
                if (deliveryForm.phone && !/^\d{10}$/.test(deliveryForm.phone)) {
                  toast.error("Phone must be 10 digits"); return;
                }
                if (deliveryForm.postcode && !/^\d{6}$/.test(deliveryForm.postcode)) {
                  toast.error("PIN code must be 6 digits"); return;
                }
                handleSaveDelivery();
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              <Check size={16} /> {editId ? "Update Address" : "Add Address"}
            </button>
            {editId && (
              <button onClick={resetForm} className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all">
                <X size={16} /> Cancel
              </button>
            )}
          </div>
        </div>

        {/* Address list */}
        {addresses.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Saved Addresses</h3>
            {addresses.map((addr) => (
              <div key={addr.address_id}
                className="group bg-white/5 border border-white/10 hover:border-indigo-500/30 rounded-2xl p-5 flex justify-between items-start cursor-pointer transition-all duration-200"
                onClick={() => { setSelectedAddress(addr); setShowAddressModal(true); }}>
                <div className="space-y-0.5">
                  <p className="font-semibold text-white">{addr.first_name} {addr.last_name}</p>
                  <p className="text-gray-400 text-sm">{addr.phone}</p>
                  <p className="text-gray-400 text-sm">{addr.street_address}, {addr.city}</p>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button onClick={(e) => { e.stopPropagation(); handleEditDelivery(addr); }}
                    className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 rounded-lg transition-all">
                    <Pencil size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteDelivery(addr.address_id); }}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Address detail modal */}
        {showAddressModal && selectedAddress && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-8 w-96 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">Delivery Address</h2>
                <button onClick={() => setShowAddressModal(false)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-all"><X size={16} /></button>
              </div>
              <div className="space-y-2.5">
                {[
                  ["Name", `${selectedAddress.first_name} ${selectedAddress.last_name}`],
                  ["Phone", selectedAddress.phone],
                  ["Street", selectedAddress.street_address],
                  ["City", selectedAddress.city],
                  ["State", selectedAddress.state],
                  ["Postcode", selectedAddress.postcode],
                  ["Country", selectedAddress.country],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-gray-500 text-sm">{label}</span>
                    <span className="text-white text-sm font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );

    if (activeTab === "visibility") return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Profile Avatar</h2>
          <p className="text-gray-400 text-sm">Upload a photo to personalise your account</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-6">
          {avatarUrl ? (
            <>
              <div className="relative">
                <img src={avatarUrl} alt="Avatar" className="w-32 h-32 rounded-full object-cover ring-4 ring-indigo-500/30" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
              </div>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl cursor-pointer transition-all shadow-lg shadow-indigo-500/20">
                  <Upload size={15} /> Change Photo
                  <input type="file" className="hidden" onChange={handleAvatarUpload} />
                </label>
                <button onClick={handleAvatarDelete} className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold rounded-xl transition-all">
                  <Trash2 size={15} /> Remove
                </button>
              </div>
            </>
          ) : (
            <label className="flex flex-col items-center gap-4 cursor-pointer group">
              <div className="w-24 h-24 rounded-full bg-white/5 border-2 border-dashed border-white/20 group-hover:border-indigo-500/50 flex items-center justify-center transition-all duration-200">
                <Upload size={28} className="text-gray-500 group-hover:text-indigo-400 transition-colors" />
              </div>
              <span className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                Upload Avatar
              </span>
              <input type="file" className="hidden" onChange={handleAvatarUpload} />
            </label>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-inter">
      <Navbar />

      {/* Ambient glows */}
      <div className="fixed top-20 left-0 w-96 h-96 bg-indigo-900/15 rounded-full blur-[128px] pointer-events-none z-0" />
      <div className="fixed bottom-20 right-0 w-96 h-96 bg-purple-900/10 rounded-full blur-[128px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10 flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-[calc(100vh-80px)]">

        {/* ── Sidebar ── */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="lg:sticky lg:top-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 lg:space-y-1">

            {/* Avatar + name header */}
            <div className="flex items-center gap-3 px-3 py-4 mb-2 border-b border-white/10">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/40" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                  {(formData.first_name?.[0] || "U").toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-white font-semibold text-sm truncate">{formData.first_name} {formData.last_name}</p>
                <p className="text-gray-500 text-xs truncate">{formData.email}</p>
              </div>
            </div>

            {/* Tab nav - Horizontal scroll on mobile, Vertical on Desktop */}
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide pr-4 lg:pr-0">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex-shrink-0 lg:w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === id
                    ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}>
                  <Icon size={16} />
                  {label}
                  {activeTab === id && <ChevronRight size={14} className="ml-auto hidden lg:block" />}
                </button>
              ))}

              {/* Mobile Only Divider if needed, or just keep flowing */}
              <div className="w-px h-6 bg-white/10 lg:hidden mx-2 self-center"></div>

              {/* Secondary Actions in same scroll or separate? Grouping them */}
              {account?.role === "seller" && (
                <button onClick={() => navigate("/seller/dashboard")}
                  className="flex-shrink-0 lg:w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 whitespace-nowrap">
                  <LayoutDashboard size={16} /> Seller Dashboard
                </button>
              )}
              <button onClick={() => navigate("/about")}
                className="flex-shrink-0 lg:w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 whitespace-nowrap">
                <Info size={16} /> About Us
              </button>
              <button onClick={() => navigate("/contact")}
                className="flex-shrink-0 lg:w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 whitespace-nowrap">
                <Mail size={16} /> Contact Us
              </button>
              <button
                onClick={() => {
                  showConfirm({
                    title: "Logout",
                    message: "Are you sure you want to logout?",
                    confirmText: "Logout",
                    type: "danger",
                    onConfirm: () => {
                      localStorage.removeItem("token");
                      window.location.href = "/login";
                    }
                  });
                }}
                className="flex-shrink-0 lg:w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all duration-200 whitespace-nowrap">
                <LogOut size={16} /> Logout
              </button>
            </div>

            {/* Desktop Only Divider/Footer nav */}
            <div className="hidden lg:block border-t border-white/10 pt-2 mt-2 space-y-1">
              {/* Items already rendered above for mobile, but structurally we want them distinct on desktop. 
                  Actually, putting them all in the flex container above works for both if styled right, 
                  but distinguishing "primary" vs "secondary" nav is useful. 
                  Let's keep the above mapping for primary tabs, and handle secondary links separately for desktop vs mobile?
                  Easier: Just put EVERYTHING in the list above, but hide the "Desktop Only Divider" content on mobile 
                  and hide the "Mobile Flow" of these items on desktop.
              */}
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            {renderContent()}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
