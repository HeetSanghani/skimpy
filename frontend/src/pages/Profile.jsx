// import Navbar from '../components/Navbar';
// import Footer from '../components/Footer';
// import React, { useState, useEffect } from "react";
// import { updateUserProfile, getUserProfile } from "../api/authApi";

// export default function Profile() {
//   const [formData, setFormData] = useState({
//     first_name: "",
//     last_name: "",
//     email: "",
//     phone: "",
//     password: "",
//     address: "",
//     gender: "",
//     DOB: "",
//     photo: null,
//   });

//   // Fetch profile data
//   useEffect(() => {
//     const fetchProfile = async () => {

//       const token = localStorage.getItem("token"); // get token stored after login
//       if (!token) {
//         console.error("No token found");
//         return;
//       }

//       try {
//         const response = await getUserProfile(token);
//         const data = response.data;

//         setFormData({
//           first_name: data.first_name || "",
//           last_name: data.last_name || "",
//           email: data.email || "",
//           phone: data.phone || "",
//           password: "",
//           address: data.address || "",
//           gender: data.gender || "",
//           DOB: data.DOB || "",
//           photo: null,
//         });
//       } catch (error) {
//         console.error("Error fetching profile:", error);
//       }
//     };
//     fetchProfile();
//   }, []);

//   const handleChange = (e) => {
//     const { name, value, files } = e.target;
//     if (name === "photo") {
//       setFormData({ ...formData, photo: files[0] });
//     } else {
//       setFormData({ ...formData, [name]: value });
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const data = new FormData();
//       Object.keys(formData).forEach((key) => {
//         if (formData[key]) data.append(key, formData[key]);
//       });

//       const response = await updateUserProfile(data);
//       alert("Profile updated successfully!");
//       console.log("Updated Profile:", response.data);
//     } catch (error) {
//       console.error("Error updating profile:", error);
//       alert("Error: " + (error.response?.data?.detail || error.message));
//     }
//   };

//   return (
//     <>
//       <Navbar />
//       <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
//         <div className="bg-white w-full max-w-3xl p-8 rounded-2xl shadow-md">
//           <h2 className="text-3xl font-extrabold text-center mb-8 tracking-tight">
//             Profile Page
//           </h2>

//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Conditionally render fields only if they have values */}
//             {formData.first_name || formData.last_name ? (
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {formData.first_name && (
//                   <div>
//                     <label className="block text-sm font-medium mb-2">First Name</label>
//                     <input
//                       type="text"
//                       name="first_name"
//                       value={formData.first_name}
//                       onChange={handleChange}
//                       className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
//                     />
//                   </div>
//                 )}
//                 {formData.last_name && (
//                   <div>
//                     <label className="block text-sm font-medium mb-2">Last Name</label>
//                     <input
//                       type="text"
//                       name="last_name"
//                       value={formData.last_name}
//                       onChange={handleChange}
//                       className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
//                     />
//                   </div>
//                 )}
//               </div>
//             ) : null}

//             {formData.email && (
//               <div>
//                 <label className="block text-sm font-medium mb-2">Email</label>
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleChange}
//                   className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
//                 />
//               </div>
//             )}

//             {formData.phone && (
//               <div>
//                 <label className="block text-sm font-medium mb-2">Phone</label>
//                 <input
//                   type="tel"
//                   name="phone"
//                   value={formData.phone}
//                   onChange={handleChange}
//                   className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
//                 />
//               </div>
//             )}

//             {formData.DOB && (
//               <div>
//                 <label className="block text-sm font-medium mb-2">Date of Birth</label>
//                 <input
//                   type="date"
//                   name="DOB"
//                   value={formData.DOB}
//                   onChange={handleChange}
//                   className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
//                 />
//               </div>
//             )}

//             {formData.gender && (
//               <div>
//                 <label className="block text-sm font-medium mb-2">Gender</label>
//                 <select
//                   name="gender"
//                   value={formData.gender}
//                   onChange={handleChange}
//                   className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
//                 >
//                   <option value="">Select</option>
//                   <option value="male">Male</option>
//                   <option value="female">Female</option>
//                   <option value="other">Other</option>
//                 </select>
//               </div>
//             )}

//             {formData.address && (
//               <div>
//                 <label className="block text-sm font-medium mb-2">Address</label>
//                 <textarea
//                   name="address"
//                   value={formData.address}
//                   onChange={handleChange}
//                   className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
//                 ></textarea>
//               </div>
//             )}

//             <div>
//               <label className="block text-sm font-medium mb-2">Profile Photo</label>
//               <input
//                 type="file"
//                 name="photo"
//                 accept="image/*"
//                 onChange={handleChange}
//                 className="w-full border border-gray-300 rounded-md p-2"
//               />
//             </div>

//             <div>
//               <button
//                 type="submit"
//                 className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
//               >
//                 Update Profile
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//       <Footer />
//     </>
//   );
// }


















import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import React, { useState, useEffect } from "react";
import { updateUserProfile, getUserProfile, sendOtp, verifyOtp } from "../api/authApi";

export default function Profile() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    address: "",
    gender: "",
    DOB: "",
    photo: null,
  });

  const [originalEmail, setOriginalEmail] = useState("");
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState("");

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await getUserProfile(token);
        const data = response.data;

        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          phone: data.phone || "",
          password: "",
          address: data.address || "",
          gender: data.gender || "",
          DOB: data.DOB || "",
          photo: null,
        });

        setOriginalEmail(data.email || "");
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      setFormData({ ...formData, photo: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleOtpChange = (e) => setOtp(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      if (formData.email === originalEmail) {
        // Email unchanged → update directly
        const data = new FormData();
        Object.keys(formData).forEach((key) => {
          if (formData[key]) data.append(key, formData[key]);
        });

        const response = await updateUserProfile(data, token);
        alert("Profile updated successfully!");
        console.log("Updated Profile:", response.data);

      } else {
        // Email changed → show OTP modal
        await sendOtp(formData.email);
        setOtpModalVisible(true);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleVerifyOtp = async () => {
    const token = localStorage.getItem("token");
    if (!otp) {
      alert("Please enter the OTP.");
      return;
    }

    try {
      const verifyResponse = await verifyOtp(formData.email, otp);
      if (verifyResponse.data.success) {
        // OTP verified → update profile
        const data = new FormData();
        Object.keys(formData).forEach((key) => {
          if (formData[key]) data.append(key, formData[key]);
        });

        const response = await updateUserProfile(data, token);
        alert("Profile updated successfully with new email!");
        console.log("Updated Profile:", response.data);
        setOriginalEmail(formData.email);
        setOtp("");
        setOtpModalVisible(false);
      } else {
        alert("OTP verification failed. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      alert("Error: " + (error.response?.data?.detail || error.message));
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-3xl p-8 rounded-2xl shadow-md">
          <h2 className="text-3xl font-extrabold text-center mb-8 tracking-tight">
            Profile Page
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
  {/* Name Fields */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label className="block text-sm font-medium mb-2">First Name</label>
      <input
        type="text"
        name="first_name"
        value={formData.first_name}
        onChange={handleChange}
        className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-2">Last Name</label>
      <input
        type="text"
        name="last_name"
        value={formData.last_name}
        onChange={handleChange}
        className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
      />
    </div>
  </div>

  {/* Email */}
  <div>
    <label className="block text-sm font-medium mb-2">Email</label>
    <input
      type="email"
      name="email"
      value={formData.email}
      onChange={handleChange}
      className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
    />
  </div>

  {/* Phone */}
  <div>
    <label className="block text-sm font-medium mb-2">Phone</label>
    <input
      type="tel"
      name="phone"
      value={formData.phone}
      onChange={handleChange}
      className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
    />
  </div>

  {/* Date of Birth */}
  <div>
    <label className="block text-sm font-medium mb-2">Date of Birth</label>
    <input
      type="date"
      name="DOB"
      value={formData.DOB}
      onChange={handleChange}
      className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
    />
  </div>

  {/* Gender */}
  <div>
    <label className="block text-sm font-medium mb-2">Gender</label>
    <select
      name="gender"
      value={formData.gender}
      onChange={handleChange}
      className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
    >
      <option value="">Select</option>
      <option value="male">Male</option>
      <option value="female">Female</option>
      <option value="other">Other</option>
    </select>
  </div>

  {/* Address */}
  <div>
    <label className="block text-sm font-medium mb-2">Address</label>
    <textarea
      name="address"
      value={formData.address}
      onChange={handleChange}
      className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
    ></textarea>
  </div>

  {/* Photo Upload */}
  <div>
    <label className="block text-sm font-medium mb-2">Profile Photo</label>
    <input
      type="file"
      name="photo"
      accept="image/*"
      onChange={handleChange}
      className="w-full border border-gray-300 rounded-md p-2"
    />
  </div>

  {/* Submit */}
  <div>
    <button
      type="submit"
      className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition"
    >
      Update Profile
    </button>
  </div>
</form>

        </div>
      </div>

      {/* OTP Modal */}
      {otpModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-80 shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Enter OTP</h3>
            <input
              type="text"
              value={otp}
              onChange={handleOtpChange}
              className="w-full border border-gray-300 rounded-md p-3 mb-4 focus:ring-2 focus:ring-black"
              placeholder="Enter OTP"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOtpModalVisible(false)}
                className="bg-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOtp}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                Verify OTP
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
