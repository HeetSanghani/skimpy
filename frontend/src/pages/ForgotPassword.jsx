import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { sendOtpThunk, forgotPasswordThunk } from "../features/auth/authSlice";
import { EyeIcon, EyeOffIcon, Mail, KeyRound, Lock, X } from "lucide-react";
import toast from 'react-hot-toast';

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/40 transition-all duration-200";

export default function ForgotPassword() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendOtp = async () => {
    if (!email) { toast.error("Please enter your email"); return; }
    try {
      const result = await dispatch(sendOtpThunk(email));
      if (sendOtpThunk.fulfilled.match(result)) {
        setShowModal(true);
        toast.success("OTP sent to your email!");
      } else {
        toast.error(result.payload || "Failed to send OTP");
      }
    } catch { toast.error("Unexpected error while sending OTP"); }
  };

  const handleSave = async () => {
    if (!otp || !newPassword || !confirmPassword) { toast.error("Please fill all fields"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    try {
      const result = await dispatch(forgotPasswordThunk({ email, otp, new_password: newPassword, confirm_password: confirmPassword }));
      if (forgotPasswordThunk.fulfilled.match(result)) {
        toast.success("Password updated successfully!");
        setShowModal(false);
        setOtp(""); setNewPassword(""); setConfirmPassword(""); setEmail("");
      } else {
        toast.error(result.payload || "Failed to update password");
      }
    } catch { toast.error("Unexpected error while resetting password"); }
  };

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
          <h2 className="mt-6 text-3xl font-bold text-white">Forgot Password</h2>
          <p className="mt-2 text-gray-400 text-sm">Enter your email to receive a reset OTP</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className={inputCls} placeholder="you@example.com" />
              </div>
              <button type="button" onClick={handleSendOtp} disabled={loading}
                className="px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all duration-200 whitespace-nowrap disabled:opacity-60">
                {loading ? "Sending…" : "Send OTP"}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          <p className="text-center text-sm text-gray-500">
            Remember your password?{" "}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </div>

      {/* OTP + Reset Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Reset Password</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-all">
                <X size={16} />
              </button>
            </div>

            {/* OTP */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">OTP Code</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type="text" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)}
                  className={`${inputCls} tracking-[0.3em] text-center text-lg`} placeholder="• • • • • •" />
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputCls} pr-11`} placeholder="••••••••" />
                <button type="button" onClick={() => setShowNewPassword((p) => !p)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-gray-500 hover:text-indigo-400 transition-colors">
                  {showNewPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputCls} pr-11`} placeholder="••••••••" />
                <button type="button" onClick={() => setShowConfirmPassword((p) => !p)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-gray-500 hover:text-indigo-400 transition-colors">
                  {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all">
                Cancel
              </button>
              <button onClick={handleSave} disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all disabled:opacity-60">
                {loading ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
