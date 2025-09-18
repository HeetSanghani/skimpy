import React, { useState } from "react";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';








export default function Profile() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    address: "",
    gender: "",
    dob: "",
    profileImage: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profileImage") {
      setFormData({ ...formData, profileImage: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Profile Data:", formData);
    alert("Profile saved! (check console for data)");
  };

  return (
    <>    <Navbar />
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
  
      <div className="bg-white w-full max-w-3xl p-8 rounded-2xl shadow-md">
        {/* Nike-style heading */}
        <h2 className="text-3xl font-extrabold text-center mb-8 tracking-tight">
          My Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First + Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
                required
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
              required
            />
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-sm font-medium mb-2">Mobile Number</label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="e.g. +91 9876543210"
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
              required
            />
          </div>

          {/* Gender + DOB */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
                required
              />
            </div>
          </div>

          {/* Profile Image */}
          <div>
            <label className="block text-sm font-medium mb-2">Profile Image</label>
            <input
              type="file"
              name="profileImage"
              accept="image/*"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-4 rounded-md transition-colors duration-300"
          >
            Save Profile
          </button>
        </form>
      </div>
      
    </div>
     <Footer />
    </>
  );
}
