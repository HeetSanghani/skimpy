import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../features/auth/authSlice";
import { EyeIcon, EyeOffIcon } from "lucide-react"; // 👁️ install: npm install lucide-react

export default function Login() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false); // 👁️ toggle state
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, token } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(credentials));

    if (login.fulfilled.match(result)) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="flex flex-1 items-center justify-center bg-white p-8 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <h2 className="text-3xl font-bold">Sign In</h2>
          <p className="text-sm text-gray-600">
            Enter your credentials to access your account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* EMAIL FIELD */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={credentials.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@example.com"
              />
            </div>

            {/* PASSWORD FIELD with Eye Toggle */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"} // 👁️ dynamic type
                  value={credentials.password}
                  onChange={handleChange}
                  required
                  className="block w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && <p className="text-red-500 text-sm">{error}</p>}

            {/* FORGOT PASSWORD LINK */}
            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white bg-black hover:bg-gray-900 rounded-md font-semibold text-lg"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* REGISTER LINK */}
          <div className="text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:underline">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
