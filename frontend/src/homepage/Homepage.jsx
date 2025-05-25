import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, BarChart2, Send, CreditCard, User, Bell, Search, Calendar, Mail, Phone, X, AlertCircle, QrCode, Clock, CheckCircle, MapPin, Navigation as NavigationIcon, Trash2 } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import EnvelopeAnimation from '../components/EnvelopeAnimation';
import { formatDistanceToNow } from 'date-fns';
import L from 'leaflet';
import webSocketService from '../services/websocket';
import Statistics from '../components/Statistics';
import Profile from '../components/Profile';

const Navigation = ({ currentPage, setCurrentPage }) => {
  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="mt-auto bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-[100]"
    >
      <div className="flex justify-between items-center px-6 py-3 max-w-screen-xl mx-auto">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentPage('home')}
          className={`flex flex-col items-center transition-colors duration-300 ${currentPage === 'home' ? 'text-green-600' : 'text-gray-400 hover:text-green-500'}`}
        >
          <Home size={28} />
          <span className="text-sm mt-1">Home</span>
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentPage('statistics')}
          className={`flex flex-col items-center transition-colors duration-300 ${currentPage === 'statistics' ? 'text-green-600' : 'text-gray-400 hover:text-green-500'}`}
        >
          <BarChart2 size={28} />
          <span className="text-sm mt-1">Statistics</span>
        </motion.button>
        
        <div className="relative -mt-6 flex flex-col items-center z-[101]">
          <motion.button 
            whileHover={{ scale: 1.1, boxShadow: "0 0 25px rgba(16, 185, 129, 0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage('pay')}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-700 text-white shadow-lg transition-all duration-300"
          >
            <Send size={32} className="transform rotate-45" />
          </motion.button>
          <span className="text-sm mt-1">Pay</span>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentPage('messages')}
          className={`flex flex-col items-center transition-colors duration-300 ${currentPage === 'messages' ? 'text-green-600' : 'text-gray-400 hover:text-green-500'}`}
        >
          <Mail size={28} />
          <span className="text-sm mt-1">Messages</span>
        </motion.button>
        
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentPage('profile')}
          className={`flex flex-col items-center transition-colors duration-300 ${currentPage === 'profile' ? 'text-green-600' : 'text-gray-400 hover:text-green-500'}`}
        >
          <User size={28} />
          <span className="text-sm mt-1">Profile</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

const Header = ({ onChatButtonClick, notificationCount }) => {
  return (
    <motion.div 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="bg-white shadow-md fixed top-0 left-0 right-0 z-50"
    >
      <div className="max-w-screen-xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#232b3b]">
              <img 
                src="/cash.png" 
                alt="Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <h1 className="text-xl font-semibold text-gray-800">CashMate</h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-gray-600 hover:text-emerald-600 transition-colors duration-300"
            >
              <Search size={20} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const QuickAction = ({ icon: Icon, label, onClick, bgColor }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center gap-4 p-6 ${bgColor} rounded-2xl shadow-md w-full transition-all duration-300`}
      onClick={onClick}
    >
      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
        <Icon size={24} />
      </div>
      <span className="text-lg font-semibold text-white">{label}</span>
    </motion.button>
  );
};

const UserIDCard = () => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    let storedUserData = localStorage.getItem('userData');
    if (!storedUserData) {
      const defaultUserData = {
        _id: 'user_' + Date.now().toString(),
        studentId: 'ST' + Date.now().toString().slice(-6),
        name: 'Test User',
        department: 'Computer Science',
        photo: 'https://randomuser.me/api/portraits/men/1.jpg',
        email: 'user@example.com',
        phone: '1234567890',
        course: 'B.Tech',
        section: 'A',
        semester: '5th',
        fatherName: 'Parent Name',
        joinDate: new Date().toISOString()
      };
      localStorage.setItem('userData', JSON.stringify(defaultUserData));
      storedUserData = JSON.stringify(defaultUserData);
      console.log('Created default user data:', defaultUserData);
    }
    setUserData(JSON.parse(storedUserData));
  }, []);

  // Robust date formatting
  function formatJoinedDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  if (!userData) {
    return (
      <motion.div
        className="bg-white rounded-2xl p-6 shadow-lg mt-6 relative overflow-hidden z-0"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-center py-8">
          <span className="text-gray-500">Loading user data...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-white rounded-3xl p-6 shadow-2xl mt-4 relative overflow-hidden z-0 border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Background Logo */}
      <div 
        className="absolute inset-0 bg-contain bg-center bg-no-repeat opacity-5 pointer-events-none"
        style={{ backgroundImage: `url('/college-logo.png')`, transform: 'scale(0.8)' }}
      />
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10">
          {/* Left: Profile Info */}
          <div className="flex-1 min-w-[260px]">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500 shadow-lg">
                <img 
                  src={userData.photo}
                  alt={userData.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{userData.name}</h3>
                <div className="mt-1">
                  <span className="text-sm text-gray-500">Student ID:</span>
                  <span className="ml-1 text-sm text-gray-800">{userData.studentId}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={16} />
                  <span className="text-sm">{userData.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={16} />
                  <span className="text-sm">{userData.phone}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Course</span>
                  <span className="font-medium text-gray-800">{userData.course}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Section</span>
                  <span className="font-medium text-gray-800">{userData.section}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">Semester</span>
                  <span className="font-medium text-gray-800">{userData.semester}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Father's Name</span>
                <span className="font-medium text-gray-800">{userData.fatherName}</span>
              </div>
            </div>
          </div>
          {/* Right: QR Code & Status */}
          <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-200 shadow-md min-w-[220px]">
            <div className="w-36 h-36 bg-white p-2 rounded-xl shadow flex items-center justify-center mb-2">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${userData.studentId}_${userData.name.replace(' ', '_')}&format=svg`}
                alt="Student QR Code"
                className="w-full h-full"
              />
            </div>
            <div className="flex items-center gap-1 text-emerald-600">
              <QrCode size={16} />
              <span className="text-xs font-medium">Scan for verification</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-gray-600">Active Student</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">Joined: <span className="font-medium text-gray-700">{formatJoinedDate(userData.joinDate)}</span></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const MoneyModal = ({ isOpen, onClose, onSubmit, type, prefilledAmount, recipientName }) => {
  const [amount, setAmount] = useState(prefilledAmount || '');
  const [error, setError] = useState('');
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState(null);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    if (value && Number(value) < 200) {
      setError('Minimum amount is ₹200');
    } else {
      setError('');
    }
  };

  const handleDeliveryOptionSelect = (option) => {
    setDeliveryOption(option);
  };

  const handleSubmit = () => {
    if (type === 'request') {
      if (!deliveryOption) {
        setError('Please select a delivery option');
        return;
      }
      setShowEnvelope(true);
      onSubmit(amount, deliveryOption);
    } else {
      onSubmit(amount);
    }
  };

  const handleEnvelopeComplete = () => {
    setShowEnvelope(false);
    onSubmit(amount);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] px-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {type === 'request' ? 'Request Cash' : 'Send Money'}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </motion.button>
              </div>

              <div className="space-y-6">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    className={`w-full px-4 py-3 rounded-lg border ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'} outline-none transition-all text-2xl font-semibold`}
                    placeholder="0.00"
                    min="200"
                    autoFocus
                  />
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1 mt-1 text-red-500 text-sm"
                    >
                      <AlertCircle size={14} />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </div>

                {/* Delivery Options (only for request type) */}
                {type === 'request' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-800">Delivery Options</h4>
                      <span className="text-xl font-bold text-emerald-600">₹{amount || '0'}</span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDeliveryOptionSelect('doorstep')}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        deliveryOption === 'doorstep'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">Doorstep Delivery</p>
                          <p className="text-sm text-gray-500">I will deliver to your location</p>
                          {deliveryOption === 'doorstep' && (
                            <p className="text-xs text-red-600 mt-1">*Additional delivery fee of ₹50 will be charged</p>
                          )}
                        </div>
                        <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center">
                          {deliveryOption === 'doorstep' && (
                            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleDeliveryOptionSelect('meet')}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        deliveryOption === 'meet'
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">Meet at Location</p>
                          <p className="text-sm text-gray-500">Meet at your preferred location</p>
                        </div>
                        <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center">
                          {deliveryOption === 'meet' && (
                            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    </motion.button>

                    {deliveryOption && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 text-blue-800 p-4 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle size={18} />
                          <h4 className="font-semibold">Delivery Instructions</h4>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm">
                            {deliveryOption === 'doorstep'
                              ? `I will deliver ₹${amount} to your location.`
                              : `Please come to the meeting location to complete the transaction of ₹${amount}.`}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3 rounded-lg text-white font-semibold text-lg ${
                    amount && Number(amount) >= 200 && (type !== 'request' || deliveryOption)
                      ? type === 'request' 
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  onClick={handleSubmit}
                  disabled={!amount || Number(amount) < 200 || (type === 'request' && !deliveryOption)}
                >
                  {type === 'request' ? 'Send Request' : 'Send Money'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
          {showEnvelope && <EnvelopeAnimation onComplete={handleEnvelopeComplete} />}
        </>
      )}
    </AnimatePresence>
  );
};

const calculateTimeAgo = (timestamp) => {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  } catch (error) {
    return 'Just now';
  }
};

const RequestList = ({ type = "others", onDeleteRequest }) => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const loggedInUserId = userData?._id;
  const [notifications, setNotifications] = useState([]);

  // Function to fetch requests
  const fetchRequests = async () => {
    if (!loggedInUserId) {
      setError("User not logged in");
      return;
    }
    setError(null);
    try {
      const response = await fetch('http://localhost:3002/api/cash-requests');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch requests');
      }
      const data = await response.json();
      if (data.status === 'success') {
        const allRequests = data.requests || [];
        if (type === "others") {
          setRequests(allRequests.filter(request => request.requester?._id !== loggedInUserId && request.status === 'pending'));
        } else {
          setRequests(allRequests.filter(request => request.requester?._id === loggedInUserId));
        }
      } else {
        throw new Error(data.message || 'Failed to process requests');
      }
    } catch (err) {
      console.error("Fetch requests error:", err);
      setError(err.message);
    }
  };

  // Force refresh interval (in milliseconds)
  const REFRESH_INTERVAL = 1000; // 1 second

  // Initial fetch
  useEffect(() => {
    fetchRequests();
  }, [type, loggedInUserId]);

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRequests();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [type, loggedInUserId]);

  // WebSocket listeners for real-time updates
  useEffect(() => {
    const handleRequestUpdate = (data) => {
      console.log('Request update received:', data);
      fetchRequests(); // Refresh the requests list
    };

    // Add WebSocket listeners
    webSocketService.addListener('request-updated', handleRequestUpdate);
    webSocketService.addListener('request-connected', handleRequestUpdate);
    webSocketService.addListener('request-deleted', handleRequestUpdate);

    return () => {
      // Cleanup listeners
      webSocketService.removeListener('request-updated', handleRequestUpdate);
      webSocketService.removeListener('request-connected', handleRequestUpdate);
      webSocketService.removeListener('request-deleted', handleRequestUpdate);
    };
  }, []);

  const handleConnect = async (request) => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (!userData._id) {
        throw new Error('User not logged in');
      }

      // Check if request is already connected
      const response = await fetch(`http://localhost:3002/api/cash-requests/${request._id}`);
      const data = await response.json();
      
      if (data.request && data.request.status === 'connected') {
        throw new Error('This request is already connected with another user');
      }

      // Show connecting animation
      const notification = {
        id: Date.now(),
        type: 'connecting',
        message: `Connecting with ${request.requester.name}...`,
        countdown: 3
      };
      setNotifications(prev => [...prev, notification]);

      // Connect users in the backend first
      const connectResponse = await fetch('http://localhost:3002/api/connections/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData._id,
          targetUserId: request.requester._id,
          requestId: request._id
        })
      });

      if (!connectResponse.ok) {
        const errorData = await connectResponse.json();
        console.error('Connect API error:', errorData);
        throw new Error(errorData.message || 'Failed to connect users');
      }

      // Send connection request through WebSocket
      const success = webSocketService.sendConnectionRequest(request.requester._id, {
        fromUserId: userData._id,
        senderName: userData.name,
        senderAvatar: userData.photo || '/default-avatar.png',
        recipientName: request.requester.name,
        recipientAvatar: request.requester.profilePhoto || '/default-avatar.png',
        amount: request.amount,
        requestId: request._id,
        location: request.location || 'College Campus',
        distance: request.distance || 'Nearby',
        deliveryOption: request.deliveryOption,
        requesterId: request.requester._id,
        type: 'connection-request'
      });

      if (!success) {
        throw new Error('Failed to send connection request');
      }

      // Start countdown animation
      let countdown = 3;
      const countdownInterval = setInterval(() => {
        setNotifications(prev => prev.map(n => {
          if (n.id === notification.id) {
            return { ...n, countdown: countdown };
          }
          return n;
        }));
        countdown--;

        if (countdown < 0) {
          clearInterval(countdownInterval);
          // Remove the notification
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
          
          // Remove request from state
          setRequests(prevRequests => prevRequests.filter(req => req._id !== request._id));
          
          // Navigate to chat page
          navigate(`/chat/${request.requester._id}`, {
            state: {
              user: {
                id: request.requester._id,
                name: request.requester.name,
                avatar: request.requester.profilePhoto || '/default-avatar.png',
                amount: request.amount,
                deliveryOption: request.deliveryOption,
                requestId: request._id,
                location: request.location || 'College Campus',
                distance: request.distance || 'Nearby'
              },
              currentLocation: { latitude: 12.9716, longitude: 77.5946 }
            }
          });
        }
      }, 1000);

    } catch (error) {
      console.error('Connection error:', error);
      // Show error notification
      setNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'error',
        message: error.message,
        duration: 5000
      }]);
    }
  };

  return (
    <motion.section 
      className="mt-8 bg-white rounded-2xl p-6 shadow-lg h-full z-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {type === "others" ? "Cash Requests" : "Your Requests"}
        </h3>
        <div className="flex items-center gap-2 text-emerald-600 text-sm">
          <Clock size={16} />
          <span>Updated just now</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {requests.length > 0 ? (
          requests.map((request) => (
            <motion.div
              key={request._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={request.requester?.profilePhoto || '/default-avatar.png'}
                      alt={request.requester?.name || 'User'}
                      className="w-12 h-12 rounded-full object-cover bg-gray-200"
                    />
                    {request.status === "pending" && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{request.requester?.name || 'Unknown User'}</h3>
                    <p className="text-sm text-gray-500">{request.requester?.department || 'Unknown Dept.'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-emerald-600">₹{request.amount}</p>
                  <p className="text-xs text-gray-400">{calculateTimeAgo(request.createdAt)}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin size={14} />
                  <span>{request.location || 'College Campus'}</span>
                  <span>•</span>
                  <span>{request.distance || 'Nearby'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {type === 'others' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleConnect(request)}
                        className="px-4 py-1.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors duration-200"
                      >
                        Connect
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onDeleteRequest(request._id)}
                        className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 ml-2"
                        title="Delete Request"
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    </>
                  )}
                  {type === 'yours' && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDeleteRequest(request._id)}
                      className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                      title="Delete Request"
                    >
                      <Trash2 size={18} />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No {type === 'yours' ? 'active' : 'nearby'} requests at the moment
          </div>
        )}
      </div>
    </motion.section>
  );
};

const ChatPage = () => {
  const { state } = useLocation();
  const { user, currentLocation } = state;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [showMap, setShowMap] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const messagesEndRef = useRef(null);
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const isRequester = user.requesterId === userData._id;

  // Generate a consistent chat ID that's the same regardless of who initiated the chat
  const chatId = useMemo(() => {
    const ids = [userData._id, user.id].sort(); // Sort to ensure consistent order
    return `chat_${ids[0]}_${ids[1]}`;
  }, [userData._id, user.id]);

  // Load chat history from MongoDB
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        console.log('Fetching chat history for:', {
          userData: userData._id,
          otherUser: user.id
        });
        
        const response = await fetch(`http://localhost:3002/api/messages/${userData._id}/${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch chat history');
        }

        const messages = await response.json();
        console.log('Received messages:', messages);
        
        // Transform messages to match our frontend format
        const transformedMessages = messages.map(msg => ({
          id: msg._id,
          text: msg.message,
          sender: msg.senderId === userData._id ? 'me' : 'other',
          timestamp: new Date(msg.timestamp).toLocaleTimeString(),
          status: msg.status
        }));

        console.log('Transformed messages:', transformedMessages);
        setMessages(transformedMessages);
        setTimeout(scrollToBottom, 100);

        // Mark messages as read
        if (transformedMessages.length > 0) {
          await fetch('http://localhost:3002/api/messages/read', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              senderId: user.id,
              recipientId: userData._id
            })
          });
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
        setError('Failed to load chat history');
      } finally {
        setLoading(false);
      }
    };

    if (userData._id && user.id) {
      fetchChatHistory();
    } else {
      console.error('Missing user IDs:', { userData, user });
      setError('User information is incomplete');
    }
  }, [user.id, userData._id]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (!userData._id) {
      console.error('ChatPage: No user ID found');
      return;
    }

    console.log('ChatPage: Initializing chat with:', {
      userId: userData._id,
      chatWithId: user.id,
      chatId: chatId
    });

    // Ensure WebSocket is connected
    if (!webSocketService.connected) {
      webSocketService.connect(userData._id);
    }

    // Set initial connection status
    setConnectionStatus(webSocketService.connected ? 'online' : 'offline');

    // Handle new messages
    const handleNewMessage = async (data) => {
      console.log('ChatPage: Received message:', data);
      
      // Only process messages for this chat
      if (data.senderId === user.id || data.recipientId === user.id) {
        const newMessage = {
          id: data.messageId,
          text: data.message,
          sender: data.senderId === userData._id ? 'me' : 'other',
          timestamp: new Date(data.timestamp).toLocaleTimeString(),
          status: 'received'
        };

        setMessages(prev => {
          const messageExists = prev.some(msg => msg.id === newMessage.id);
          return messageExists ? prev : [...prev, newMessage];
        });

        scrollToBottom();

        // Mark message as read if we're the recipient
        if (data.senderId === user.id) {
          webSocketService.socket.emit('mark-messages-read', { chatId: data.chatId });
        }
      }
    };

    // Handle message status updates
    const handleMessageStatus = (data) => {
      console.log('ChatPage: Message status update:', data);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === data.messageId ? { ...msg, status: data.status } : msg
        )
      );
    };

    // Add listeners
    const unsubscribeMessage = webSocketService.addListener('new-message', handleNewMessage);
    const unsubscribeStatus = webSocketService.addListener('message-status-update', handleMessageStatus);
    
    // Cleanup function
    return () => {
      unsubscribeMessage();
      unsubscribeStatus();
    };
  }, [userData._id, user.id, chatId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const timestamp = new Date();
      
      try {
        console.log('Sending message:', {
          senderId: userData._id,
          recipientId: user.id,
          message: newMessage.trim()
        });
        
        // Send message to server
        const response = await fetch('http://localhost:3002/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            senderId: userData._id,
            recipientId: user.id,
            message: newMessage.trim()
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const savedMessage = await response.json();
        console.log('Message saved:', savedMessage);
        
        // Add message to UI
        const messageObj = {
          id: savedMessage._id,
          text: newMessage.trim(),
          sender: 'me',
          timestamp: new Date(savedMessage.timestamp).toLocaleTimeString(),
          status: savedMessage.status
        };

        setMessages(prev => [...prev, messageObj]);
        setNewMessage('');
        setTimeout(scrollToBottom, 100);

        // Send via WebSocket for real-time delivery
        webSocketService.sendMessage(user.id, {
          message: newMessage.trim(),
          timestamp: timestamp.toISOString()
        });
      } catch (error) {
        console.error('Error sending message:', error);
        setError('Failed to send message');
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render message with status
  const renderMessage = (message) => (
    <motion.div 
      key={message.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-[70%] p-3 rounded-lg ${
        message.sender === 'me' 
          ? 'bg-blue-600 text-white rounded-br-none'
          : message.sender === 'system'
          ? 'bg-gray-100 text-gray-600 rounded-lg'
          : 'bg-gray-200 text-gray-800 rounded-bl-none'
      }`}>
        <p className="break-words">{message.text}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs opacity-75">{message.timestamp}</span>
          {message.sender === 'me' && (
            <span className="text-xs">
              {message.status === 'sending' && '⌛'}
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'error' && '⚠️'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Add status indicator to the header
  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case 'online':
        return (
          <div className="flex items-center gap-1 text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs">Online</span>
            </div>
        );
      case 'offline':
        return (
          <div className="flex items-center gap-1 text-gray-500">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-xs">Offline</span>
            </div>
        );
      case 'checking':
        return (
          <div className="flex items-center gap-1 text-yellow-600">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-xs">Checking...</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-red-600">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-xs">Disconnected</span>
        </div>
        );
    }
  };

  const renderDeliverySection = () => {
    if (!user.deliveryOption) return null;

    const isDeliveryOptionMessage = isRequester 
      ? `You selected ${user.deliveryOption === 'doorstep' ? 'doorstep delivery' : 'meet at location'}`
      : `${user.name} wants to ${user.deliveryOption === 'doorstep' ? 'deliver to your location' : 'meet at a location'}`;

    return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-lg shadow-lg mb-4"
          >
        <div className="flex items-center justify-between mb-4">
              <div>
            <h3 className="text-lg font-semibold text-gray-800">Delivery Option</h3>
            <p className="text-sm text-gray-600">{isDeliveryOptionMessage}</p>
              </div>
          <div className="text-2xl font-bold text-emerald-600">₹{user.amount}</div>
            </div>

        {!isRequester && deliveryStatus === 'pending' && (
          <div className="flex gap-2 mt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              onClick={() => handleDeliveryResponse(true)}
              className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium"
            >
              Accept
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              onClick={() => handleDeliveryResponse(false)}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg font-medium"
            >
              Reject
              </motion.button>
            </div>
        )}

        {deliveryStatus !== 'pending' && (
          <div className={`mt-4 p-3 rounded-lg ${
            deliveryStatus === 'accepted' 
              ? 'bg-emerald-50 text-emerald-800' 
              : 'bg-red-50 text-red-800'
          }`}>
              <p className="text-sm">
              {deliveryStatus === 'accepted' 
                ? 'Delivery option accepted! You can proceed with the transaction.' 
                : 'Delivery option rejected. Please discuss an alternative arrangement.'}
            </p>
              </div>
        )}
          </motion.div>
    );
  };

  const handleDeliveryResponse = (accepted) => {
    setDeliveryStatus(accepted ? 'accepted' : 'rejected');
    const message = accepted 
      ? 'I accept your delivery option.' 
      : 'Sorry, I prefer a different delivery arrangement. Let\'s discuss.';
    webSocketService.sendMessage(user.id, message);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Connection Header */}
          <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white shadow-md p-6"
      >
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/" className="text-gray-600 hover:text-gray-800">
              <X size={24} />
            </Link>
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-12 h-12 rounded-full border-2 border-emerald-500"
            />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500">{user.department}</p>
                {renderConnectionStatus()}
            </div>
              </div>
          </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
                <MapPin size={16} />
                <span>{user.location}</span>
              </div>
            <div className="flex items-center gap-1">
                <NavigationIcon size={16} />
                <span>{calculateDistance()}m away</span>
            </div>
              </div>
            </div>
          </motion.div>
          
          {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-screen-xl mx-auto space-y-4">
          {/* Connection Message */}
            <motion.div
            initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-100 text-emerald-800 p-4 rounded-lg text-center"
          >
            You're connected with {user.name}
            </motion.div>

          {/* Delivery Section */}
          {renderDeliverySection()}

          {/* Chat Messages */}
          <div className="space-y-4">
            {messages.map(message => renderMessage(message))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-screen-xl mx-auto">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-6 py-2 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 transition-colors duration-300"
              disabled={connectionStatus === 'offline' || connectionStatus === 'disconnected'}
            >
              Send
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
};

const ChatList = ({ onClose, onChatSelect }) => {
  const [activeChats, setActiveChats] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial active chats
    const chats = webSocketService.getActiveChats();
    setActiveChats(chats);

    // Listen for active chats updates
    const handleActiveChatsUpdate = (updatedChats) => {
      setActiveChats(updatedChats);
    };

    const unsubscribe = webSocketService.addListener('active-chats-update', handleActiveChatsUpdate);

    return () => {
      webSocketService.removeListener('active-chats-update', handleActiveChatsUpdate);
    };
  }, []);

  const handleChatSelect = (chat) => {
    webSocketService.resetUnreadCount(chat.userId);
    navigate(`/chat/${chat.userId}`, {
      state: {
        user: {
          id: chat.userId,
          name: chat.name,
          avatar: chat.avatar,
          amount: chat.amount,
          location: chat.location || 'College Campus',
          distance: chat.distance || 'Nearby'
        },
        currentLocation: { latitude: 12.9716, longitude: 77.5946 }
      }
    });
    if (onClose) onClose();
  };

  return (
    <>
      {/* Overlay for focus */}
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-40"
        style={{ pointerEvents: 'none' }}
      />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.98 }}
        className="fixed left-1/2 bottom-32 transform -translate-x-1/2 z-50 w-full max-w-md shadow-2xl rounded-2xl bg-white border border-gray-100"
        style={{ minHeight: '320px' }}
    >
        <div className="p-5 border-b flex justify-between items-center rounded-t-2xl bg-gray-50">
          <h3 className="font-semibold text-lg text-gray-800">Active Chats</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors duration-200">
            <X size={22} />
          </button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: '350px' }}>
        {activeChats.length > 0 ? (
          activeChats.map((chat) => (
            <motion.button
              key={chat.userId}
                whileHover={{ backgroundColor: 'rgba(16, 185, 129, 0.08)' }}
                className="w-full flex items-center gap-4 px-5 py-4 border-b border-gray-100 hover:bg-emerald-50 transition-colors duration-200 focus:outline-none"
              onClick={() => handleChatSelect(chat)}
            >
              <div className="relative">
                <img
                  src={chat.avatar}
                  alt={chat.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-emerald-100 shadow-sm"
                />
                {chat.online && (
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                )}
                {chat.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold shadow">{chat.unreadCount}</span>
                )}
              </div>
              <div className="flex-1 text-left">
                  <h4 className="font-medium text-gray-900 text-base">{chat.name}</h4>
                  <p className="text-xs text-gray-500 truncate">
                  {chat.lastMessage?.text || 'Start chatting'}
                </p>
              </div>
                <div className="text-right min-w-[60px]">
                <p className="text-xs text-gray-400">
                  {chat.timestamp ? formatDistanceToNow(new Date(chat.timestamp), { addSuffix: true }) : ''}
                </p>
                <p className="text-sm font-medium text-emerald-600">₹{chat.amount}</p>
              </div>
            </motion.button>
          ))
        ) : (
            <div className="p-10 text-center text-gray-400 flex flex-col items-center justify-center h-full">
              <img src="/chat-empty.svg" alt="No chats" className="w-20 h-20 mb-4 opacity-70" />
              <p className="font-medium text-lg">No active chats</p>
            <p className="text-sm mt-1">Connect with someone to start chatting</p>
          </div>
        )}
      </div>
    </motion.div>
    </>
  );
};

const NotificationBadge = ({ count }) => {
  return count > 0 ? (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
      {count}
    </span>
  ) : null;
};

const Homepage = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const navigate = useNavigate();
  const [cashRequests, setCashRequests] = useState([]);
  const [error, setError] = useState(null);
  const [activeChats, setActiveChats] = useState([]);
  const [showChatList, setShowChatList] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData && userData._id) {
      webSocketService.connect(userData._id);
      
      // Handle incoming connection requests
      const handleConnectionRequest = (data) => {
        console.log('Received connection request:', data);
        const { fromUserId, senderName, amount, deliveryOption, requesterId } = data;
        
        // Create notification
        const notification = {
          id: Date.now(),
          type: 'connection-request',
          message: `${senderName} wants to connect with you for ₹${amount}`,
          data: data
        };
        setNotifications(prev => [...prev, notification]);

        // Auto-navigate to chat page for recipient
        navigate(`/chat/${fromUserId}`, {
          state: {
            user: {
              id: fromUserId,
              name: senderName,
              amount: amount,
              location: 'College Campus',
              distance: 'Nearby',
              deliveryOption: deliveryOption,
              requesterId: requesterId
            },
            currentLocation: { latitude: 12.9716, longitude: 77.5946 }
          }
        });
        
        // Remove notification after delay
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
      };
      
      const handleNewMessage = (data) => {
        console.log('Received new message:', data);
        const notification = {
          id: Date.now(),
          type: 'message',
          message: `New message from ${data.senderName}`,
          data: data
        };
        setNotifications(prev => [...prev, notification]);
        
        setActiveChats(prev => prev.map(chat => {
          if (chat.userId === data.senderId) {
            return { ...chat, unreadCount: (chat.unreadCount || 0) + 1 };
          }
          return chat;
        }));
        
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, 5000);
      };
      
      // Add listeners
      const unsubscribeConnectionRequest = webSocketService.addListener('new-connection-request', handleConnectionRequest);
      const unsubscribeNewMessage = webSocketService.addListener('new-message', handleNewMessage);
      
      return () => {
        unsubscribeConnectionRequest();
        unsubscribeNewMessage();
      };
    }
  }, [navigate]);

  const handleRequestSubmit = async (amount, deliveryOption) => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (!userData._id) {
      setAlertMessage('Please log in to create a request.');
      setShowAlert(true);
      setIsRequestModalOpen(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3002/api/cash-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requesterId: userData._id,
          amount: Number(amount),
          reason: 'Cash request',
          deliveryOption: deliveryOption
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create request');
      }

      const data = await response.json();
      
      
      setCashRequests(prevRequests => [...prevRequests, data.request]);
      
      setAlertMessage('Cash request created successfully!');
      setShowAlert(true);
      setIsRequestModalOpen(false);

      // Store the request ID in localStorage for tracking
      const userRequests = JSON.parse(localStorage.getItem('userRequests') || '[]');
      userRequests.push({
        id: data.request._id,
        amount: Number(amount),
        status: "pending"
      });
      localStorage.setItem('userRequests', JSON.stringify(userRequests));

      // Navigate to Radar page after creating request
      navigate('/radar', { 
        state: { 
          requestId: data.request._id,
          amount: Number(amount),
          deliveryOption 
        } 
      });
    } catch (err) {
      console.error("Create request error:", err);
      setAlertMessage(err.message || 'Could not create the request.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
      setIsRequestModalOpen(false);
    }
  };

  const handleSendSubmit = (amount) => {
    setIsSendModalOpen(false);
    console.log('Sending amount:', amount);
  };

  const handleAcceptRequest = (request) => {
    setSelectedRequest(request);
    setIsSendModalOpen(true);
  };

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/cash-requests');
        if (!response.ok) {
          throw new Error('Failed to fetch cash requests');
        }
        const data = await response.json();
        if (data.status === 'success') {
          setCashRequests(data.requests || []);
        } else {
          throw new Error(data.message || 'Failed to fetch requests');
        }
      } catch (err) {
        console.error("Fetch requests error:", err);
        setError(err.message);
      }
    };
    fetchRequests();
  }, []);

  const handleDeleteRequest = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        const response = await fetch(`http://localhost:3002/api/cash-requests/${requestId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete request');
        }
        setCashRequests(prevRequests => prevRequests.filter(req => req._id !== requestId));
      } catch (err) {
        console.error("Delete request error:", err);
        setError(err.message || 'Could not delete the request.');
        setTimeout(() => setError(null), 5000);
      }
    }
  };

  const handleChatSelect = (chat) => {
    navigate(`/chat/${chat.userId}`, {
      state: {
        user: {
          id: chat.userId,
          name: chat.name,
          avatar: chat.avatar,
          amount: chat.amount,
          location: 'College Campus',
          distance: 'Nearby'
        },
        currentLocation: { latitude: 12.9716, longitude: 77.5946 }
      }
    });
    setShowChatList(false);
  };

  const renderNotification = (notification) => {
    if (notification.type === 'connecting') {
      return (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-2xl p-8 min-w-[300px] border border-gray-100"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
              <motion.div
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1],
                  borderWidth: ["4px", "2px", "4px"]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "easeInOut"
                }}
                className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
              />
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-gray-800 mb-2">{notification.message}</p>
              <motion.p 
                key={notification.countdown}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold text-emerald-600"
              >
                {notification.countdown}
              </motion.p>
            </div>
          </div>
        </motion.div>
      );
    }

    // Return existing notification types
    return (
      <motion.div
        key={notification.id}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 right-4 z-50 bg-white rounded-lg shadow-lg p-4 border-l-4 border-emerald-500 max-w-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${notification.type === 'connection-request' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
            <p className="text-sm text-gray-800">{notification.message}</p>
          </div>
          <button 
            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    );
  };

  // Add this right before the renderNotification function
  const renderConnectingBackdrop = () => {
    const connectingNotification = notifications.find(n => n.type === 'connecting');
    if (!connectingNotification) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      />
    );
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return (
          <>
            <UserIDCard />
            <section className="mt-8 mb-24">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickAction 
                  icon={Send} 
                  label="Send Money" 
                  onClick={() => setIsSendModalOpen(true)} 
                  bgColor="bg-gradient-to-r from-emerald-500 to-emerald-700"
                />
                <QuickAction 
                  icon={CreditCard} 
                  label="Request Cash" 
                  onClick={() => setIsRequestModalOpen(true)} 
                  bgColor="bg-gradient-to-r from-blue-500 to-blue-700"
                />
              </div>
            </section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
              <RequestList type="others" onDeleteRequest={handleDeleteRequest} />
              <RequestList type="yours" onDeleteRequest={handleDeleteRequest} />
            </div>
          </>
        );
      case 'statistics':
        return <Statistics />;
      case 'profile':
        return <Profile />;
      case 'messages':
        return (
          <ChatList
            onClose={() => setCurrentPage('home')}
            onChatSelect={handleChatSelect}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header 
        onChatButtonClick={() => setShowChatList(!showChatList)} 
        notificationCount={activeChats.reduce((acc, chat) => acc + (chat.unreadCount || 0), 0)}
      />
      
      <AnimatePresence>
        {showChatList && (
          <ChatList
            onClose={() => setShowChatList(false)}
            onChatSelect={handleChatSelect}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {renderConnectingBackdrop()}
        {notifications.map(notification => renderNotification(notification))}
      </AnimatePresence>
      
      <motion.main 
        className="flex-1 px-6 pt-24 pb-32 max-w-screen-xl mx-auto w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <AnimatePresence>
          {showAlert && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
                <AlertCircle size={20} />
                <span>{alertMessage}</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAlert(false)}
                  className="ml-4 text-red-700 hover:text-red-900"
                >
                  <X size={20} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {renderContent()}
      </motion.main>

      <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      <MoneyModal 
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSubmit={handleRequestSubmit}
        type="request"
      />

      <MoneyModal 
        isOpen={isSendModalOpen}
        onClose={() => {
          setIsSendModalOpen(false);
          setSelectedRequest(null);
        }}
        onSubmit={handleSendSubmit}
        type="send"
        prefilledAmount={selectedRequest?.amount}
        recipientName={selectedRequest?.name}
      />
    </div>
  );
};

export default Homepage;
