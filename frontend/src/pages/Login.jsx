import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";

export default function Login() {
    const [credentials, setCredentials] = useState({ email: "", password: "" });
    const navigate = useNavigate(); // ✅ Added

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials({ ...credentials, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {

            const response = await loginUser({
                email: credentials.email,
                password: credentials.password,
            });

            console.log(response.data);


            localStorage.setItem("token", response.data.access_token);


        navigate("/")
        } catch (error) {
            console.error("Login error:", error.response?.data);

            alert(error.response?.data?.detail || "Login failed");
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
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={credentials.password}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 text-white bg-black hover:bg-gray-900 rounded-md font-semibold text-lg"
                        >
                            Sign In
                        </button>
                    </form>

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
