import axios from 'axios';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";

export default function RegisterPage() {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Handle manual registration
  async function handleRegister() {
    if (!firstname || !lastname || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/`,
        { firstname, lastname, email, password }
      );

      toast.success("Registration Successful");
      localStorage.setItem("token", res.data.token);
      navigate("/login");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Registration failed");
    }
  }

  // Handle Google OAuth registration
  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        const accessToken = response.access_token;
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/user/create-google`,
          { accessToken }
        );

        toast.success("Register Successful");
        localStorage.setItem("token", res.data.token);

        if (res.data.role === "admin") {
          navigate("/admin/");
        } else {
          navigate("/");
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Google register failed");
      }
    },
    onError: () => {
      toast.error("Google register failed");
    },
  });

  return (
    <div className="w-full h-screen bg-[url('/login-background.jpg')] bg-cover bg-center flex justify-center gap-12 items-center">
      {/* Left image block */}
      <div className="w-[600px] h-[500px] rounded-2xl shadow-2xl overflow-hidden">
        <img
          src="/login-image3.jpg"
          alt="Register Visual"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Registration Form */}
      <div className="w-[400px] h-[500px] py-10 px-5 backdrop-blur-md bg-white/30 rounded-2xl shadow-2xl flex flex-col justify-center items-center">
        <h2 className="text-2xl font-semibold text-purple-600 mb-8">Register New Account</h2>

        <input
          type="text"
          placeholder="First Name"
          value={firstname}
          onChange={(e) => setFirstname(e.target.value)}
          className="w-[300px] h-[40px] px-3 mb-4 rounded-md border border-white bg-green-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
          className="w-[300px] h-[40px] px-3 mb-4 rounded-md border border-white bg-green-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-[300px] h-[40px] px-3 mb-4 rounded-md border border-white bg-green-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-[300px] h-[40px] px-3 mb-4 rounded-md border border-white bg-green-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <button
          onClick={handleRegister}
          className="w-[300px] h-[40px] mb-4 text-white font-semibold bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-md transition"
        >
          Register
        </button>

        <p className="mb-4 text-sm text-gray-700">or</p>

        <button
          onClick={googleLogin}
          className="w-[300px] h-[40px] flex items-center justify-center gap-3 text-purple-600 font-semibold border border-purple-600 hover:text-white hover:bg-purple-700 active:bg-purple-800 rounded-md transition"
        >
          <FcGoogle className="text-2xl" />
          <span>Register with Google</span>
        </button>
      </div>
    </div>
  );
}
