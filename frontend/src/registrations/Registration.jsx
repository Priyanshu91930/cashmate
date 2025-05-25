import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Check, X, Send, MessageSquare, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Registration = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpMethod, setOtpMethod] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValid = phone.length === 10;
  const isOtpValid = otp.every(digit => digit !== '');

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setPhone(value);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }
    
    if (!/^\d*$/.test(value) && value !== '') return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    }
  };

  const sendOtp = async (method) => {
    setLoading(true);
    setError('');
    
    try {
      const phoneNumber = `+91${phone}`; // Format phone number for Twilio
      console.log('Sending OTP to:', phoneNumber);
      
      const response = await fetch('http://localhost:3002/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber })
      });

      const data = await response.json();
      console.log('OTP Response:', data);
      
      if (data.success) {
        setOtpSent(true);
        setOtpMethod(method);
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError('');
    
    try {
      const enteredOtp = otp.join('');
      const phoneNumber = `+91${phone}`;
      
      const response = await fetch('http://localhost:3002/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phoneNumber,
          otp: enteredOtp
        })
      });

      const data = await response.json();

      if (data.success) {
        navigate('/userdata', { 
          state: { 
            phone: `+91 ${phone}`,
            verified: true 
          } 
        });
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
      console.error('Error verifying OTP:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingUser = async (phoneNumber, email) => {
    try {
      const response = await fetch('http://localhost:3002/api/auth/check-existing-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: phoneNumber,
          email 
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking user:', error);
      return { status: 'error', message: error.message };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Format phone number
      const phoneNumber = phone.startsWith('+91') 
        ? phone.replace(/\s/g, '') 
        : `+91${phone.replace(/\s/g, '')}`;

      // Check if user already exists
      const userCheck = await checkExistingUser(phoneNumber, email);
      
      if (userCheck.status === 'success') {
        // User exists, redirect to login
        setError('User already exists. Please login.');
        navigate('/login');
        return;
      }

      // Proceed with registration if user doesn't exist
      const response = await fetch('http://localhost:3002/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone: phoneNumber,
          password,
          // ... other registration data ...
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        // Store user data
        localStorage.setItem('userData', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        
        // Navigate to home
        navigate('/home');
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="w-full max-w-md p-8 bg-white rounded-[32px] shadow-xl"
      >
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-gray-800 text-3xl font-bold">Registration</h2>
          <p className="text-gray-600 text-sm mt-3">
            {!otpSent 
              ? "Enter your mobile phone number, we will send you an OTP to verify later."
              : `Enter the OTP sent to +91 ${phone} via ${otpMethod}`
            }
          </p>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center my-8"
        >
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-32 h-32 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full flex items-center justify-center shadow-lg"
          >
            <img 
              src="/images/2.png" 
              alt="Registration Illustration" 
              className="w-24 h-24 object-contain"
            />
          </motion.div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!otpSent ? (
            <motion.div
              key="phone-input"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-gray-700 text-sm font-medium mb-2">Phone Number</label>
              <div className="flex items-center border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-emerald-500 transition-colors duration-300">
                <Phone size={20} className="text-gray-400 mr-2" />
                <span className="text-gray-600 mr-2">+91</span>
                <input 
                  type="text" 
                  placeholder="Enter your phone number" 
                  value={phone}
                  onChange={handleChange}
                  maxLength="10"
                  className="flex-1 outline-none text-gray-800 text-lg placeholder:text-gray-400"
                />
                {phone && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-2"
                  >
                    {isValid ? 
                      <Check size={20} className="text-emerald-500" /> : 
                      <X size={20} className="text-red-500" />
                    }
                  </motion.span>
                )}
              </div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 space-y-4"
              >
                <motion.button 
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => sendOtp('SMS')}
                  disabled={!isValid || loading}
                  className={`w-full py-4 rounded-xl text-white text-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                    isValid && !loading
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-700 shadow-lg' 
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={20} />
                      <span>Send Via SMS</span>
                    </>
                  )}
                </motion.button>

                <motion.button 
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => sendOtp('WhatsApp')}
                  disabled={!isValid || loading}
                  className={`w-full py-4 rounded-xl text-white text-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                    isValid && !loading
                      ? 'bg-gradient-to-r from-blue-500 to-blue-700 shadow-lg' 
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <MessageSquare size={20} />
                      <span>Send Via WhatsApp</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="otp-input"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="mt-6"
            >
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-colors duration-300"
                  />
                ))}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-sm text-center mt-4"
                >
                  {error}
                </motion.p>
              )}

              <div className="mt-8 space-y-4">
                <motion.button
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={verifyOtp}
                  disabled={!isOtpValid || loading}
                  className={`w-full py-4 rounded-xl text-white text-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                    isOtpValid && !loading
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-700 shadow-lg' 
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <span>Verify OTP</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-sm text-gray-500 mt-6"
        >
          By creating and/or using an account, you agree to our{' '}
          <motion.span 
            className="text-emerald-600 font-medium cursor-pointer"
            whileHover={{ scale: 1.05 }}
          >
            Terms & Conditions
          </motion.span>
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default Registration;
