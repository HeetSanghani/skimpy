import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { resetPasswordThunk, resetAuthState } from "../features/auth/authSlice";
import { EyeIcon, EyeOffIcon } from "lucide-react"; // 👁️ npm install lucide-react

const ResetPassword = () => {
  const dispatch = useDispatch();
  const { loading, error, resetSuccess } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    old_password: "",
    password: "",
    confirm_password: "",
  });

  // 👁️ Password visibility states
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirm_password) {
      alert("Passwords do not match");
      return;
    }

    dispatch(resetPasswordThunk(formData));
  };

  // ✅ Clear auth state after showing success/error message
  useEffect(() => {
    if (resetSuccess || error) {
      const timer = setTimeout(() => {
        dispatch(resetAuthState());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [resetSuccess, error, dispatch]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>

        {/* ✅ Feedback Messages */}
        {error && (
          <p className="text-center mb-4 text-sm text-red-500">❌ {error}</p>
        )}
        {resetSuccess && (
          <p className="text-center mb-4 text-sm text-green-600">
            ✅ Password reset successfully!
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Old Password Field */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Old Password
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                name="old_password"
                value={formData.old_password}
                onChange={handleChange}
                className="w-full px-4 py-2 pr-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
              <button
                type="button"
                onClick={() => setShowOldPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showOldPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 pr-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                required
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

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className="w-full px-4 py-2 pr-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                required
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
