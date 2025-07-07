import React, { useState } from "react";
import axiosInstance from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        await login(response.data.user, response.data.token);
        if (response.data.user.role === "admin") {
          navigate("/admin-dashboard");
        } else {
          navigate("/employee-dashboard");
        }
      } else {
        alert(response.data.error);
      }
    } catch (error) {
      if (error.response && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center bg-fixed">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      <div className="relative z-10 flex flex-col items-center space-y-6">
        <h2 className="text-4xl md:text-5xl text-amber-500 font-bold font-['Playfair_Display'] tracking-tight">
          Royal King Dhaba
        </h2>
        <div className="w-80 sm:w-96 bg-[#fffaf0] bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] border-2 border-[#d4a373] rounded-lg shadow-xl p-8">
          <h3 className="text-2xl font-semibold text-[#4a3728] font-['Playfair_Display'] mb-6 text-center">
            Welcome Back
          </h3>
          {errorMessage && (
            <p className="text-red-600 bg-red-100 border border-red-300 rounded-md px-3 py-2 mb-4 text-sm font-['Lora']">
              {errorMessage}
            </p>
          )}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[#4a3728] font-['Lora'] text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2 border border-[#d4a373]/50 rounded-md bg-white/80 text-[#4a3728] font-['Lora'] focus:outline-none focus:ring-2 focus:ring-[#d4a373] transition duration-200"
                required
              />
            </div>
            <div>
              <label className="block text-[#4a3728] font-['Lora'] text-sm font-medium mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2 border border-[#d4a373]/50 rounded-md bg-white/80 text-[#4a3728] font-['Lora'] focus:outline-none focus:ring-2 focus:ring-[#d4a373] transition duration-200"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d4a373] text-white font-['Lora'] font-medium py-2 rounded-md hover:bg-[#b5895f] transition duration-200 disabled:bg-[#d4a373]/50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
        <footer className="relative z-10 text-[#fffaf0] text-sm font-['Lora'] mt-4">
          Designed and developed by <a href="https://webaziz.in" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 transition duration-200">webaziz.in</a>
        </footer>
      </div>
    </div>
  );
};

export default Login;