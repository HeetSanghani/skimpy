import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  sendOtpThunk,
  verifyOtpThunk,
  registerThunk,
  resetOtpFlow,
} from "../features/auth/authSlice";
import { loginUser } from "../api/authApi";
import { createVendor } from "../api/vendorApi";
import { EyeIcon, EyeOffIcon, Mail, Lock, User, KeyRound, X } from "lucide-react";
import toast from 'react-hot-toast';

// ── Shared input style ──────────────────────────────────────────────────────
const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/40 transition-all duration-200";

const userRoles = ["user", "seller"];

export default function Register() {
  // ── ORIGINAL STATE (unchanged) ───────────────────────────────────────────
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, otpSent, otpVerified } = useSelector((state) => state.auth);

  // ── ORIGINAL useEffect (unchanged) ──────────────────────────────────────
  useEffect(() => {
    if (otpVerified) {
      dispatch(
        registerThunk({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          role: formData.role,
        })
      ).then(async (res) => {
        if (registerThunk.fulfilled.match(res)) {
          try {
            if (formData.role === "seller") {
              const loginRes = await loginUser({
                email: formData.email,
                password: formData.password,
              });
              const token = loginRes.data?.access_token;
              if (token) localStorage.setItem("token", token);
              const vendor = await createVendor({ user_id: res.payload?.user_id, token });
              if (vendor?._id) localStorage.setItem("vendor_id", vendor._id);
              localStorage.removeItem("token");
            }
          } catch (err) {
            console.error("Vendor setup after signup failed:", err);
          }
          toast.success("Account created successfully!");
          dispatch(resetOtpFlow());
          navigate("/login");
        }
      });
    }
  }, [otpVerified]);

  // ── ORIGINAL HANDLERS (unchanged) ────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    dispatch(sendOtpThunk(formData.email));
  };

  const handleVerifyOtp = () => {
    dispatch(verifyOtpThunk({ email: formData.email, otp }));
  };

  // ── UI (dark theme) ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12 relative overflow-hidden">
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
            <span className="font-sora font-extrabold text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              SKIMPY
            </span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-white">Create Account</h2>
          <p className="mt-2 text-gray-400 text-sm">Sign up to access exclusive products &amp; features</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl space-y-5">
          <form onSubmit={handleRegisterClick} className="space-y-5">

            {/* Names */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">First Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required
                    className={inputCls} placeholder="Heet" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Last Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required
                    className={inputCls} placeholder="Sanghani" />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} required
                  className={inputCls} placeholder="you@example.com" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required
                  className={`${inputCls} pr-11`} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword((p) => !p)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-gray-500 hover:text-indigo-400 transition-colors">
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1.5">Min 8 chars, uppercase, number &amp; special character</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required
                  className={`${inputCls} pr-11`} placeholder="••••••••" />
                <button type="button" onClick={() => setShowConfirmPassword((p) => !p)}
                  className="absolute inset-y-0 right-3.5 flex items-center text-gray-500 hover:text-indigo-400 transition-colors">
                  {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Role — custom toggle (no native select = no white dropdown) */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                {userRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, role }))}
                    className={`py-3 rounded-xl font-semibold text-sm transition-all duration-200 border ${formData.role === role
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/20"
                      : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                      }`}
                  >
                    {role === "user" ? "🛍️ Buyer" : "🏪 Seller"}
                  </button>
                ))}
              </div>
              {/* Hidden select to preserve native form required validation */}
              <select name="role" value={formData.role} onChange={handleChange} required
                className="sr-only" aria-hidden="true" tabIndex={-1}>
                <option value="">Select Role</option>
                {userRoles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending OTP…
                </span>
              ) : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </div>

      {/* OTP Modal — original logic, dark UI */}
      {otpSent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Verify Email</h3>
                <p className="text-gray-400 text-sm mt-0.5">Enter the 6-digit OTP sent to your email</p>
              </div>
              <button onClick={() => dispatch(resetOtpFlow())}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-all">
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">OTP Code</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className={`${inputCls} tracking-[0.3em] text-center text-lg`}
                  placeholder="• • • • • •"
                />
              </div>
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all disabled:opacity-60">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying…
                </span>
              ) : "Verify & Register"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
