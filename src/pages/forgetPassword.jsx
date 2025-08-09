import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function ForgetPasswordPage() {
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  function sendOtp() {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    axios
      .post(`${import.meta.env.VITE_BACKEND_URL}/api/user/send-OTP`, { email })
      .then((res) => {
        setOtpSent(true);
        toast.success("OTP sent to your email. Check your inbox.");
        console.log(res.data);
      })
      .catch((err) => {
        toast.error("Email not found");
      });
  }

  function verifyOtp() {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const otpNumber = parseInt(otp.trim(), 10);
    if (isNaN(otpNumber)) {
      toast.error("Please enter a valid numeric OTP");
      return;
    }

    axios
      .post(`${import.meta.env.VITE_BACKEND_URL}/api/user/reset-password`, {
        email,
        otp: otpNumber,
        newPassword,
      })
      .then((res) => {
        toast.success("Password reset successfully");
        console.log(res.data);
        navigate("/login");
      })
      .catch((err) => {
        console.error(err);
        toast.error(err?.response?.data?.message || "Invalid OTP");
      });
  }

  function handleResend() {
    // Reset OTP state and fields
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setOtpSent(false);
  }

  return (
    <div className="w-full h-screen bg-[url('/login-background.jpg')] bg-cover bg-center flex justify-center items-center gap-12">
      {/* Image */}
      <div className="w-[600px] h-[500px] rounded-2xl shadow-2xl">
        <img
          src="/login-image3.jpg"
          alt="Login Visual"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>

      {/* OTP or Email Form */}
      {otpSent ? (
        <div className="w-[400px] h-[500px] py-10 px-5 backdrop-blur-md bg-white/30 rounded-2xl shadow-2xl flex flex-col justify-center items-center">
          <h2 className="text-2xl font-semibold text-purple-600 mb-8">Reset Password</h2>

          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-[300px] h-[40px] px-3 mb-4 rounded-md border border-white bg-green-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-[300px] h-[40px] px-3 mb-4 rounded-md border border-white bg-green-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-[300px] h-[40px] px-3 mb-4 rounded-md border border-white bg-green-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          <button
            onClick={verifyOtp}
            className="w-[300px] h-[40px] text-white font-semibold bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-md mb-4 transition"
          >
            Reset Password
          </button>

          <button
            onClick={handleResend}
            className="w-[300px] h-[40px] flex items-center justify-center text-purple-600 font-semibold border border-purple-600 hover:text-white hover:bg-purple-700 active:bg-purple-800 rounded-md transition"
          >
            Resend OTP
          </button>
        </div>
      ) : (
        <div className="w-[400px] h-[500px] py-10 px-5 backdrop-blur-md bg-white/30 rounded-2xl shadow-2xl flex flex-col justify-center items-center">
          <h2 className="text-2xl font-semibold text-purple-600 mb-8">Forgot Password</h2>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-[300px] h-[40px] px-3 mb-6 rounded-md border border-white bg-green-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          <button
            onClick={sendOtp}
            className="w-[300px] h-[40px] text-white font-semibold bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-md transition"
          >
            Send OTP
          </button>
        </div>
      )}
    </div>
  );
}
