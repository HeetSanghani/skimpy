import { useState, useEffect } from "react";
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
} from "../api/settingsApi";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("account");

  // ----------------- ACCOUNT DETAILS -----------------
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    DOB: "",
    gender: "",
  });

  useEffect(() => {
    if (activeTab === "account") {
      getAccountDetails()
        .then((data) => setFormData(data))
        .catch((err) =>
          alert(err.detail || "Failed to load account details")
        );
    }
  }, [activeTab]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateAccountDetails(formData)
      .then(() => alert("Account details updated successfully"))
      .catch((err) => alert(err.detail || "Failed to update account"));
  };

  const handleDeleteAccount = () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    deleteAccount()
      .then(() => {
        alert("Account deleted successfully");
        localStorage.removeItem("token"); // clear session
        window.location.href = "/login"; // redirect to login page
      })
      .catch((err) => alert(err.detail || "Failed to delete account"));
  };



  // ----------------- DELIVERY ADDRESSES -----------------
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
  const [addresses, setAddresses] = useState([]);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (activeTab === "delivery") {
      getDeliveryAddresses()
        .then((data) => setAddresses(data))
        .catch((err) =>
          alert(err.detail || "Failed to load delivery addresses")
        );
    }
  }, [activeTab]);

  const handleDeliveryChange = (e) => {
    const { name, value } = e.target;
    setDeliveryForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveDelivery = () => {
    if (editId) {
      updateDeliveryAddress(editId, deliveryForm) // editId is address_id now
        .then((updated) => {
          setAddresses((prev) =>
            prev.map((addr) => (addr.address_id === editId ? updated : addr))
          );
          resetForm();
          alert("Address updated successfully");
        })
        .catch((err) => alert(err.detail || "Failed to update address"));
    }
    else {
      addDeliveryAddress(deliveryForm)
        .then((newAddr) => {
          setAddresses((prev) => [...prev, newAddr]);
          resetForm();
          alert("Address added successfully");
        })
        .catch((err) => alert(err.detail || "Failed to add address"));
    }
  };

  const handleEditDelivery = (addr) => {
    setDeliveryForm(addr);
    setEditId(addr.address_id); // 👈 use address_id instead of id
  };

const handleDeleteDelivery = (address_id) => {
  console.log("Deleting address_id:", address_id);
  deleteDeliveryAddress(address_id)
    .then(() => {
      alert("Address deleted successfully");
      setAddresses((prev) => prev.filter((a) => a.address_id !== address_id)); // update UI
    })
    .catch((err) => alert(err.detail || "Failed to delete address"));
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


// ----------------- PROFILE AVATAR -----------------
const [avatarUrl, setAvatarUrl] = useState(null);
const [uploading, setUploading] = useState(false);

useEffect(() => {
  if (activeTab === "visibility") {
    getProfileAvatar()
      .then((data) => setAvatarUrl(data.avatar_url))
      .catch((err) => alert(err.detail || "Failed to load avatar"));
  }
}, [activeTab]);

const handleAvatarUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploading(true);
  try {
    const res = await addProfileAvatar(file);
    setAvatarUrl(res.avatar_url);
    alert("Profile avatar uploaded successfully");
  } catch (err) {
    alert(err.detail || "Failed to upload avatar");
  } finally {
    setUploading(false);
  }
};

const handleAvatarDelete = async () => {
  if (!window.confirm("Are you sure you want to delete your avatar?")) return;

  try {
    await deleteProfileAvatar();
    setAvatarUrl(null);
    alert("Profile avatar deleted successfully");
  } catch (err) {
    alert(err.detail || "Failed to delete avatar");
  }
};


  // ----------------- TABS -----------------
  const tabs = [
    {
      id: "account",
      title: "Account Details",
      content: (
        <div className="space-y-4 ">
          <div className="grid grid-cols-2 gap-4">
            <input
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="First Name"
              className="border rounded-lg p-2 w-full"
            />
            <input
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Last Name"
              className="border rounded-lg p-2 w-full"
            />
          </div>

          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="border rounded-lg p-2 w-full"
          />
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone"
            className="border rounded-lg p-2 w-full"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              name="DOB"
              value={formData.DOB}
              onChange={handleChange}
              className="border rounded-lg p-2 w-full"
            />
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="border rounded-lg p-2 w-full"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-700"
            >
              Save
            </button>
            <button
              onClick={handleDeleteAccount}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-700"
            >
              Delete Account
            </button>
          </div>
        </div>
      ),

    },
    {
      id: "delivery",
      title: "Delivery Addresses",
      content: (
        <div className="space-y-6">
          {/* Add / Edit form */}
          <div className="grid grid-cols-2 gap-4">
            <input
              name="first_name"
              placeholder="First Name"
              value={deliveryForm.first_name}
              onChange={handleDeliveryChange}
              className="border rounded-lg p-2"
            />
            <input
              name="last_name"
              placeholder="Last Name"
              value={deliveryForm.last_name}
              onChange={handleDeliveryChange}
              className="border rounded-lg p-2"
            />
            <input
              name="phone"
              placeholder="Phone"
              value={deliveryForm.phone}
              onChange={handleDeliveryChange}
              className="border rounded-lg p-2"
              maxLength="10"
            />
            <input
              name="street_address"
              placeholder="Street Address"
              value={deliveryForm.street_address}
              onChange={handleDeliveryChange}
              className="border rounded-lg p-2 col-span-2"
            />
            <input
              name="city"
              placeholder="City"
              value={deliveryForm.city}
              onChange={handleDeliveryChange}
              className="border rounded-lg p-2"
            />
            <input
              name="postcode"
              placeholder="Postcode"
              value={deliveryForm.postcode}
              onChange={handleDeliveryChange}
              className="border rounded-lg p-2"
            />
            <input
              name="state"
              placeholder="State"
              value={deliveryForm.state}
              onChange={handleDeliveryChange}
              className="border rounded-lg p-2"
            />
            <input
              name="country"
              placeholder="Country"
              value={deliveryForm.country}
              onChange={handleDeliveryChange}
              className="border rounded-lg p-2"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveDelivery}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-700"
            >
              {editId ? "Update Address" : "Add Address"}
            </button>
            {editId && (
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            )}
          </div>

          {/* List of addresses */}
          <div className="space-y-4 mt-6">
            {addresses.map((address) => (
              <div key={address.address_id} className="p-4 border rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">
                    {address.first_name} {address.last_name}
                  </p>
                  <p>{address.phone}</p>
                  <p>
                    {address.street_address}, {address.city}, {address.state} {address.postcode}
                  </p>
                  <p>{address.country}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditDelivery(address)}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteDelivery(address.address_id)} // 👈 fix here
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))

            }
          </div>
        </div>
      ),
    },
    {
  id: "visibility",
  title: "Profile Visibility",
  content: (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Profile Avatar</h2>

      {avatarUrl ? (
        <div className="space-y-2">
          <img
            src={avatarUrl}
            alt="Profile Avatar"
            className="w-32 h-32 rounded-full object-cover border"
          />
          <div className="flex gap-2">
            <label className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
              Change Avatar
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </label>
            <button
              onClick={handleAvatarDelete}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-700"
            >
              Delete Avatar
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-gray-600 mb-2">No avatar uploaded</p>
          <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
            Upload Avatar
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
          </label>
        </div>
      )}
    </div>
  ),
}

  ];

  // ----------------- LAYOUT -----------------
  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-1/4 border-r p-4 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left p-2 rounded-lg ${
              activeTab === tab.id ? "bg-black text-white" : "hover:bg-gray-700 hover:text-white"
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="w-3/4 p-6">{tabs.find((t) => t.id === activeTab)?.content}</div>
    </div>
  );
}
