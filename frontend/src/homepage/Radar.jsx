"use client";
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Home } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, doc, setDoc, onSnapshot, query, where, GeoPoint, serverTimestamp } from 'firebase/firestore';
import webSocketService from '../services/websocket';

// Active user simulation - these represent users who are currently active
const ACTIVE_USERS = []; // Empty initial array - we'll populate with real users

const INACTIVE_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

// Mock users that will always be shown
const MOCK_USERS = [
  { 
    id: "mock1", 
    name: "Alice (Demo)", 
    distance: 1.2, 
    img: "https://randomuser.me/api/portraits/women/1.jpg", 
    bio: "Demo User 1",
    location: "Campus Center",
    latitude: 12.9718,
    longitude: 77.5948,
    lastActive: Date.now()
  },
  { 
    id: "mock2", 
    name: "Bob (Demo)", 
    distance: 2.5, 
    img: "https://randomuser.me/api/portraits/men/2.jpg", 
    bio: "Demo User 2",
    location: "Library",
    latitude: 12.9720,
    longitude: 77.5950,
    lastActive: Date.now()
  }
];

const Radar = () => {
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [hoveredUserId, setHoveredUserId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [connectionNotification, setConnectionNotification] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const requestData = location.state;

  // Create a broadcast channel for cross-tab communication
  const broadcastChannel = new BroadcastChannel('radar_channel');

  // Handle WebSocket connection and events
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!userData._id) {
      navigate('/');
      return;
    }

    console.log('Radar: Setting up WebSocket connection for user:', userData._id);

    // Connect to WebSocket service
    webSocketService.connect(userData._id);

    // Handle connection status
    const handleConnectionStatus = (status) => {
      console.log('Radar: WebSocket connection status:', status);
      if (status.status === 'error') {
        setError('Connection error: ' + status.error);
      }
    };

    // Handle connection requests
    const handleConnectionRequest = (data) => {
      console.log('Radar: Received connection request:', data);
      
      setConnectionNotification({
        senderName: data.senderName,
        senderAvatar: data.senderAvatar,
        amount: data.amount,
        requestId: data.requestId,
        fromUserId: data.fromUserId,
        deliveryOption: data.deliveryOption,
        countdown: 3
      });

      let countdown = 3;
      const countdownInterval = setInterval(() => {
        console.log('Radar: Countdown:', countdown);
        setConnectionNotification(prev => {
          if (!prev) return null;
          return {
            ...prev,
            countdown: countdown
          };
        });
        countdown--;

        if (countdown < 0) {
          clearInterval(countdownInterval);
          setConnectionNotification(null);
          // Navigate to chat page
          navigate(`/chat/${data.fromUserId}`, {
            state: {
              user: {
                id: data.fromUserId,
                name: data.senderName,
                avatar: data.senderAvatar,
                amount: data.amount,
                deliveryOption: data.deliveryOption,
                requestId: data.requestId
              },
              currentLocation: userLocation
            }
          });
    }
      }, 1000);
    };

    // Add event listeners
    const removeConnectionStatus = webSocketService.addListener('connection-status', handleConnectionStatus);
    const removeConnectionRequest = webSocketService.addListener('new-connection-request', handleConnectionRequest);

    // Cleanup function
    return () => {
      removeConnectionStatus();
      removeConnectionRequest();
    };
  }, [navigate]);

  // Handle geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          
          const userData = JSON.parse(localStorage.getItem('userData') || '{}');
          if (!userData._id) return;

            const newUser = {
            id: userData._id,
            name: userData.name,
            img: userData.photo,
            bio: `Student ID: ${userData.studentId}`,
            email: userData.email,
              distance: 0,
              location: "Current Location",
              latitude: location.latitude,
              longitude: location.longitude,
              lastActive: Date.now(),
              isReal: true
            };
            
            setCurrentUser(newUser);
          setNearbyUsers([newUser, ...MOCK_USERS]);
        },
        (error) => {
          console.error("Error getting location:", error);
          setError('Unable to get your location. Please enable location services.');
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  }, []);

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleUserSelect = (user) => {
    if (!currentUser) return;
    
    // Navigate to chat page
    navigate(`/chat/${user.id}`, {
      state: {
        user: {
          ...user,
          studentId: user.id,
          avatar: user.img
        },
        currentLocation: userLocation
      }
    });
  };

  const getTooltipPosition = (angle) => {
    const degrees = (angle * 180) / Math.PI;
    
    // Adjust positioning for different sections of the radar
    if (degrees > 150 && degrees < 210) {
      return "top-full mt-4"; // Bottom center profiles
    } else if (degrees >= 210 && degrees < 270) {
      return "-bottom-24 -left-24"; // Bottom right profiles
    } else if (degrees >= 90 && degrees <= 150) {
      return "-bottom-24 -right-24"; // Bottom left profiles
    } else if (degrees >= 270 || degrees <= 90) {
      return "-bottom-24"; // Top profiles
    }
    return "-bottom-24";
  };

  // Render notification if present
  const renderNotification = () => {
    if (!connectionNotification) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50 max-w-md"
      >
        <div className="flex items-center gap-3 mb-2">
          <img
            src={connectionNotification.senderAvatar || '/default-avatar.png'}
            alt={connectionNotification.senderName}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold text-gray-800">
              You're going to connect with {connectionNotification.senderName}
            </p>
            <p className="text-sm text-gray-600">
              Amount: ₹{connectionNotification.amount}
            </p>
          </div>
        </div>
        <p className="text-emerald-600 font-medium">
          Connecting in {connectionNotification.countdown || 3} seconds...
        </p>
      </motion.div>
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-screen bg-black overflow-hidden">
      {renderNotification()}
      {/* Home Button */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-colors duration-300 cursor-pointer z-50"
        onClick={() => navigate('/home')}
      >
        <Home size={20} />
        <span>Home</span>
      </motion.button>

      {/* Active Users Text */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-6 text-center"
      >
        <h2 className="text-2xl font-semibold text-white mb-2">
          Active Users Nearby
        </h2>
        <p className="text-gray-300">
          {nearbyUsers.length} users found nearby
        </p>
      </motion.div>

      {/* Radar visualization */}
      <div className="relative flex items-center justify-center w-full h-full">
        {/* Expanding radar circles */}
        {[1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-green-500"
            style={{ width: `${i * 150}px`, height: `${i * 150}px` }}
            animate={{ scale: [1, 2, 3], opacity: [0.8, 0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: i * 0.5 }}
          />
        ))}

        {/* Radar center dot */}
        <div className="w-4 h-4 bg-green-500 rounded-full" />

        {/* Nearby user profiles */}
        <div className="absolute inset-0 flex items-center justify-center">
          {nearbyUsers.length === 0 ? (
            <div className="text-white">No active users found nearby...</div>
          ) : (
            nearbyUsers.map((user, index) => {
              const maxDistance = 4;
              const baseDistance = 200;
              const minDistance = 120;
              const scaledDistance = Math.max(minDistance, (user.distance / maxDistance) * baseDistance);
              
              const angleOffset = (2 * Math.PI) / nearbyUsers.length;
              const angle = index * angleOffset;
              
              const tooltipPosition = getTooltipPosition(angle);
              const degrees = (angle * 180) / Math.PI;
              const isBottomHalf = degrees > 90 && degrees < 270;
              
              return (
                <motion.div
                  key={user.id}
                  className="absolute"
                  style={{
                    top: `calc(50% + ${Math.sin(angle) * scaledDistance}px)`,
                    left: `calc(50% + ${Math.cos(angle) * scaledDistance}px)`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <motion.div
                    className="relative group isolate cursor-pointer"
                    whileHover={{ scale: 1.1, zIndex: 50 }}
                    initial={{ zIndex: isBottomHalf ? 2 : 1 }}
                    onHoverStart={() => {
                      setSelectedUser(user);
                      setHoveredUserId(user.id);
                    }}
                    onHoverEnd={() => {
                      setSelectedUser(null);
                      setHoveredUserId(null);
                    }}
                    onClick={() => handleUserSelect(user)}
                  >
                    <motion.div 
                      className={`w-14 h-14 rounded-full overflow-hidden relative z-10 transition-all duration-300 ${
                        user.id === currentUser?.id ? 'border-4 border-blue-500' : 'border-2 border-white'
                      }`}
                      animate={{
                        filter: hoveredUserId && hoveredUserId !== user.id ? "blur(2px) brightness(0.5)" : "blur(0px) brightness(1)",
                        scale: hoveredUserId === user.id ? 1 : 1
                      }}
                    >
                      <img src={user.img} alt={user.name} className="w-full h-full object-cover" />
                    </motion.div>
                    
                    {/* Distance indicator */}
                    <div 
                      className={`absolute -top-2 -right-2 ${
                        user.id === currentUser?.id ? 'bg-blue-500' : 'bg-green-500'
                      } text-white text-xs px-2 py-1 rounded-full z-20 transition-opacity duration-300 ${
                        hoveredUserId && hoveredUserId !== user.id ? 'opacity-30' : 'opacity-100'
                      }`}
                    >
                      {user.id === currentUser?.id ? 'You' : `${user.distance.toFixed(1)}km`}
                    </div>

                    {/* Dynamic positioned tooltip */}
                    <AnimatePresence>
                      {hoveredUserId === user.id && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className={`absolute transition-opacity duration-200 
                          ${tooltipPosition} transform -translate-x-1/2 bg-black/80 backdrop-blur-md 
                          text-white p-3 rounded-lg w-48 z-[60] pointer-events-none shadow-lg`}
                          style={{
                            left: '50%',
                            marginTop: isBottomHalf ? '0.5rem' : undefined,
                          }}
                        >
                          <div className="relative">
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-gray-300">{user.bio}</p>
                            {user.id === currentUser?.id ? (
                              <>
                                <p className="text-xs text-blue-400 mt-1">This is you</p>
                                <p className="text-xs text-gray-300">{user.email}</p>
                                <p className="text-xs text-gray-300">{user.phone}</p>
                                <p className="text-xs text-gray-300">Course: {user.course}</p>
                                <p className="text-xs text-gray-300">Section: {user.section}</p>
                                <p className="text-xs text-gray-300">Semester: {user.semester}</p>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-green-400 mt-1">{user.distance.toFixed(1)}km away</p>
                                <p className="text-xs text-blue-400">Active now</p>
                                <p className="text-xs text-gray-300">{user.email}</p>
                                <p className="text-xs text-gray-300">{user.phone}</p>
                                <p className="text-xs text-gray-300">Course: {user.course}</p>
                                <p className="text-xs text-gray-300">Section: {user.section}</p>
                              </>
                            )}
                            {user.location && (
                              <p className="text-xs text-gray-400 mt-1">{user.location}</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Status text */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-green-500 text-sm">
          {nearbyUsers.length} active users nearby
        </div>
      </div>
    </div>
  );
};

export default Radar;