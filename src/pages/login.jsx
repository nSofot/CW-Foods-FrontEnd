import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { useNavigate, Link } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Google OAuth Login
  const googleLogin = useGoogleLogin({
    onSuccess: async ({ access_token }) => {
      try {
        const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/user/login/google`, {
          accessToken: access_token,
        });

        toast.success("Login Successful");
        localStorage.setItem("token", res.data.token);

        if (res.data.role === "admin") {
          navigate("/admin/products");
        } else {
          navigate("/");
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Google login failed");
      }
    },
    onError: () => toast.error("Google login failed"),
  });

  // Email/Password Login
  async function handleLogin() {
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/user/login`, {
        email,
        password,
      });

      toast.success("Login Success");
      localStorage.setItem("token", res.data.token);

      if (res.data.role === "admin") {
        navigate("/admin/products");
      } else {
        navigate("/");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login failed");
    }
  }

  return (
    <div className="w-full h-screen bg-[url('/login-background.jpg')] bg-cover bg-center flex justify-center items-center gap-12">
      {/* Left image block */}
      <div className="w-[600px] h-[500px] rounded-2xl shadow-2xl overflow-hidden hidden md:block">
        <img
          src="/login-image3.jpg"
          alt="Login Visual"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Login Form */}
      <div className="w-[400px] h-[500px] py-10 px-5 backdrop-blur-md bg-white/30 rounded-2xl shadow-2xl flex flex-col justify-center items-center">
        <h2 className="text-2xl font-semibold text-purple-600 mb-8">Login to Your Account</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-[300px] h-[40px] px-3 rounded-md border border-white bg-green-50 mb-5 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-[300px] h-[40px] px-3 rounded-md border border-white bg-green-50 mb-5 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <button
          onClick={handleLogin}
          className="w-[300px] h-[40px] text-white font-semibold bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-md mb-4 transition"
        >
          Login
        </button>

        <button
          onClick={googleLogin}
          className="w-[300px] h-[40px] flex items-center justify-center gap-3 text-purple-600 font-semibold border border-purple-600 hover:text-white hover:bg-purple-700 active:bg-purple-800 rounded-md transition"
        >
          <FcGoogle className="text-2xl" />
          <span>Login with Google</span>
        </button>

        <div className="flex justify-between items-center text-blue-800 gap-10 pt-4 pb-6">
          <Link to="/register" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
            Register New Account
          </Link>
          <Link to="/forget" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  );
}
