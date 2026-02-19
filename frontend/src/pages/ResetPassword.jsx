import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { resetPasswordThunk, resetAuthState } from "../features/auth/authSlice";
import { EyeIcon, EyeOffIcon, Lock, CheckCircle, XCircle } from "lucide-react";
import toast from 'react-hot-toast';

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/40 transition-all duration-200";

const ResetPassword = () => {
  const dispatch = useDispatch();
  const { loading, error, resetSuccess } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ old_password: "", password: "", confirm_password: "" });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirm_password) { toast.error("Passwords do not match"); return; }
    dispatch(resetPasswordThunk(formData));
  };

  useEffect(() => {
    if (resetSuccess || error) {
      const timer = setTimeout(() => dispatch(resetAuthState()), 3000);
      return () => clearTimeout(timer);
    }
  }, [resetSuccess, error, dispatch]);

  const PasswordField = ({ label, name, show, onToggle }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        <input type={show ? "text" : "password"} name={name} value={formData[name]} onChange={handleChange} required
          className={`${inputCls} pr-11`} placeholder="••••••••" />
        <button type="button" onClick={onToggle}
          className="absolute inset-y-0 right-3.5 flex items-center text-gray-500 hover:text-indigo-400 transition-colors">
          {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-black text-base">S</span>
            </div>
            <span className="font-sora font-extrabold text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">SKIMPY</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-white">Reset Password</h2>
          <p className="mt-2 text-gray-400 text-sm">Update your account password</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl space-y-5">
          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <XCircle size={16} /> {error}
            </div>
          )}
          {resetSuccess && (
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
              <CheckCircle size={16} /> Password reset successfully!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordField label="Current Password" name="old_password" show={showOldPassword} onToggle={() => setShowOldPassword((p) => !p)} />
            <PasswordField label="New Password" name="password" show={showNewPassword} onToggle={() => setShowNewPassword((p) => !p)} />
            <PasswordField label="Confirm New Password" name="confirm_password" show={showConfirmPassword} onToggle={() => setShowConfirmPassword((p) => !p)} />

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Resetting…
                </span>
              ) : "Reset Password"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">← Back to Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
