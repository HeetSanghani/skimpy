// import React, { useState } from "react";
// import { sendOtp, verifyOtp, forgotPassword } from "../api/authApi"; // :white_check_mark: Ensure these APIs exist
// export default function ForgotPassword() {
//   const [email, setEmail] = useState("");
//   const [otp, setOtp] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [showModal, setShowModal] = useState(false);
//   const handleSendOtp = async () => {
//     if (!email) {
//       alert("Please enter your email");
//       return;
//     }
//     try {
//       setLoading(true);
//       console.log("----email", email)
//       await sendOtp(email);
//       setShowModal(true); // :white_check_mark: open popup
//       alert("OTP sent to your email!");
//     } catch (err) {
//       alert(err.response?.data?.detail || "Failed to send OTP");
//     } finally {
//       setLoading(false);
//     }
//   };
//   const handleSave = async () => {
//     if (!otp || !newPassword || !confirmPassword) {
//       alert("Please fill all fields");
//       return;
//     }
//     if (newPassword !== confirmPassword) {
//       alert("Passwords do not match");
//       return;
//     }
//     try {
//       setLoading(true);
//       // :white_check_mark: Verify OTP first
//       const verifyRes = await verifyOtp(email, otp);
//       if (!verifyRes.data.success) {
//         alert(verifyRes.data.message || "Invalid OTP");
//         return;
//       }
//       // :white_check_mark: Reset password
//       await forgotPassword({
//         email,
//         otp,
//         new_password: newPassword,
//       });
//       alert("Password updated successfully!");
//       setShowModal(false);
//       setOtp("");
//       setNewPassword("");
//       setConfirmPassword("");
//       setEmail("");
//     } catch (err) {
//       alert(err.response?.data?.detail || "Failed to update password");
//     } finally {
//       setLoading(false);
//     }
//   };
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
//       <div className="w-full max-w-md bg-white shadow-md rounded-lg p-8 space-y-6">
//         <h2 className="text-3xl font-bold text-center">Forgot Password</h2>
//         <p className="text-sm text-gray-600 text-center">
//           Enter your email to receive an OTP and reset your password.
//         </p>
//         {/* Email + Send OTP */}
//         <div>
//           <label className="block text-sm font-medium text-gray-700">
//             Email Address
//           </label>
//           <div className="flex mt-1">
//             <input
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//               className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//             />
//             <button
//               type="button"
//               onClick={handleSendOtp}
//               disabled={loading}
//               className="px-4 py-2 bg-black text-white rounded-r-md hover:bg-gray-900"
//             >
//               {loading ? "Sending..." : "Send OTP"}
//             </button>
//           </div>
//         </div>
//       </div>
//       {/* OTP + Password Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded-lg shadow-lg w-96 space-y-4">
//             <h3 className="text-xl font-semibold text-center">Reset Password</h3>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 OTP
//               </label>
//               <input
//                 type="text"
//                 maxLength="6"
//                 value={otp}
//                 onChange={(e) => setOtp(e.target.value)}
//                 className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md tracking-widest text-center text-lg"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 New Password
//               </label>
//               <input
//                 type="password"
//                 value={newPassword}
//                 onChange={(e) => setNewPassword(e.target.value)}
//                 className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 Confirm Password
//               </label>
//               <input
//                 type="password"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//                 className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
//               />
//             </div>
//             <div className="flex justify-end gap-3 pt-2">
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSave}
//                 disabled={loading}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
//               >
//                 {loading ? "Saving..." : "Save"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }




















import React, { useState } from "react";
import { sendOtp, forgotPassword } from "../api/authApi"; // ✅ removed verifyOtp

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // ✅ Send OTP
  const handleSendOtp = async () => {
    if (!email) {
      alert("Please enter your email");
      return;
    }
    try {
      setLoading(true);
      await sendOtp(email);
      setShowModal(true); 
      alert("OTP sent to your email!");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Reset Password with OTP
  const handleSave = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await forgotPassword({
        email,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
    //   alert(res.message); // ✅ shows backend success message
      // reset states
      setShowModal(false);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setEmail("");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center">Forgot Password</h2>
        <p className="text-sm text-gray-600 text-center">
          Enter your email to receive an OTP and reset your password.
        </p>
        {/* Email + Send OTP */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <div className="flex mt-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="px-4 py-2 bg-black text-white rounded-r-md hover:bg-gray-900"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </div>
        </div>
      </div>

      {/* OTP + Password Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 space-y-4">
            <h3 className="text-xl font-semibold text-center">Reset Password</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                OTP
              </label>
              <input
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md tracking-widest text-center text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
