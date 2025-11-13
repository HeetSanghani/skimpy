
// import React, { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { sendOtpThunk, forgotPasswordThunk } from "../features/auth/authSlice";

// export default function ForgotPassword() {
//   const dispatch = useDispatch();
//   const { loading, error } = useSelector((state) => state.auth);

//   const [email, setEmail] = useState("");
//   const [otp, setOtp] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [showModal, setShowModal] = useState(false);

//   // ✅ Send OTP
//   const handleSendOtp = async () => {
//     if (!email) {
//       alert("Please enter your email");
//       return;
//     }
//     try {
//       const resultAction = await dispatch(sendOtpThunk(email));
//       if (sendOtpThunk.fulfilled.match(resultAction)) {
//         setShowModal(true);
//         alert("OTP sent to your email!");
//       } else {
//         alert(resultAction.payload || "Failed to send OTP");
//       }
//     } catch {
//       alert("Unexpected error while sending OTP");
//     }
//   };

//   // ✅ Reset Password with OTP
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
//       const resultAction = await dispatch(
//         forgotPasswordThunk({
//           email,
//           otp,
//           new_password: newPassword,
//           confirm_password: confirmPassword,
//         })
//       );

//       if (forgotPasswordThunk.fulfilled.match(resultAction)) {
//         alert("Password updated successfully!");
//         setShowModal(false);
//         setOtp("");
//         setNewPassword("");
//         setConfirmPassword("");
//         setEmail("");
//       } else {
//         alert(resultAction.payload || "Failed to update password");
//       }
//     } catch {
//       alert("Unexpected error while resetting password");
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
//           {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
//         </div>
//       </div>

//       {/* OTP + Password Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded-lg shadow-lg w-96 space-y-4">
//             <h3 className="text-xl font-semibold text-center">Reset Password</h3>

//             <div>
//               <label className="block text-sm font-medium text-gray-700">OTP</label>
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
import { useDispatch, useSelector } from "react-redux";
import { sendOtpThunk, forgotPasswordThunk } from "../features/auth/authSlice";
import { EyeIcon, EyeOffIcon } from "lucide-react"; // 👁️ install if not already: npm install lucide-react

export default function ForgotPassword() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showModal, setShowModal] = useState(false);

  // 👁️ Password visibility toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ✅ Send OTP
  const handleSendOtp = async () => {
    if (!email) {
      alert("Please enter your email");
      return;
    }
    try {
      const resultAction = await dispatch(sendOtpThunk(email));
      if (sendOtpThunk.fulfilled.match(resultAction)) {
        setShowModal(true);
        alert("OTP sent to your email!");
      } else {
        alert(resultAction.payload || "Failed to send OTP");
      }
    } catch {
      alert("Unexpected error while sending OTP");
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
      const resultAction = await dispatch(
        forgotPasswordThunk({
          email,
          otp,
          new_password: newPassword,
          confirm_password: confirmPassword,
        })
      );

      if (forgotPasswordThunk.fulfilled.match(resultAction)) {
        alert("Password updated successfully!");
        setShowModal(false);
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setEmail("");
      } else {
        alert(resultAction.payload || "Failed to update password");
      }
    } catch {
      alert("Unexpected error while resetting password");
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
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      </div>

      {/* OTP + Password Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 space-y-4">
            <h3 className="text-xl font-semibold text-center">Reset Password</h3>

            {/* OTP Field */}
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

            {/* New Password Field with Eye */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field with Eye */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Modal Buttons */}
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
