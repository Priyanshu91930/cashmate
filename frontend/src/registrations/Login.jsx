import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Mail, Send, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const isFormValid = email && otp && name && password && confirmPassword && password === confirmPassword;

  const handleLogin = (e) => {
    e.preventDefault();
    
    try {
      // Create a unique session ID for this tab
      const sessionId = `session_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
      
      // Create login session data
      const sessionData = {
        sessionId,
        email,
        name: `${name}_${sessionId.slice(-4)}`,
        loginTime: Date.now(),
        isActive: true,
        studentId: `ST${Math.floor(Math.random() * 10000000)}`,
        profilePic: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}_${sessionId}`,
      };

      // Store session in sessionStorage (tab-specific)
      sessionStorage.setItem('loginSession', JSON.stringify(sessionData));
      
      // Store active users in localStorage with session ID as key
      const activeUsers = JSON.parse(localStorage.getItem('activeUsers') || '{}');
      activeUsers[sessionId] = {
        ...sessionData,
        lastActive: Date.now()
      };
      localStorage.setItem('activeUsers', JSON.stringify(activeUsers));
      
      // Navigate to home
      navigate('/home');
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 overflow-auto"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        className="w-full max-w-[900px] bg-white rounded-[32px] shadow-xl flex flex-col md:flex-row items-center p-6 md:p-10 gap-8"
      >
        {/* Left Section with Image and Text */}
        <motion.div 
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col justify-center items-center md:items-start w-full md:w-1/2 text-center md:text-left"
        >
          <h1 className="text-gray-800 text-4xl md:text-5xl font-bold">Welcome</h1>
          <p className="text-gray-600 text-lg mt-4">
            Set a name for your profile, here's <br className="hidden md:block" /> the password
          </p>
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center md:justify-start w-full"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-64 h-64 md:w-72 md:h-72 mt-6"
            >
              <img 
                src="/images/login.png" 
                alt="Profile" 
                className="w-full h-full object-contain"
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right Section with Form */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full md:w-1/2 flex flex-col items-center"
        >
          <div className="w-full max-w-[320px] space-y-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm text-gray-600 mb-2">Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 text-gray-800 transition-colors duration-300"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-sm text-gray-600 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 text-gray-800 transition-colors duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <label className="block text-sm text-gray-600 mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 text-gray-800 transition-colors duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <label className="block text-sm text-gray-600 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 text-gray-800 transition-colors duration-300"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 transition-colors duration-300"
              >
                <Send size={18} />
                <span>Send OTP</span>
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <label className="block text-sm text-gray-600 mb-2">OTP</label>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 text-gray-800 transition-colors duration-300"
              />
            </motion.div>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
              }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 rounded-xl text-white text-lg font-medium transition-all duration-300 ${
                isFormValid 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-700 shadow-lg' 
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
              disabled={!isFormValid}
              onClick={handleLogin}
            >
              Continue
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Login;
