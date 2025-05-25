import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { X, MapPin, Navigation as NavigationIcon, Send, AlertCircle, Play } from 'lucide-react';
import L from 'leaflet';
import webSocketService from '../services/websocket';

const ChatPage = () => {
  const { state } = useLocation();
  const { user, currentLocation } = state || {
    user: {
      name: 'Unknown User',
      department: 'N/A',
      location: 'Unknown',
      avatar: 'https://randomuser.me/api/portraits/lego/1.jpg'
    },
    currentLocation: {
      latitude: 0,
      longitude: 0
    }
  };
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedPaymentOption, setSelectedPaymentOption] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState(null);
  const [confirmedDelivery, setConfirmedDelivery] = useState(null);
  const [isRequestUser, setIsRequestUser] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationRoute, setNavigationRoute] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const mapRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize WebSocket connection and message handling
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (!userData._id) {
      console.error('ChatPage: No user ID found in localStorage');
      return;
    }

    console.log('ChatPage: Initializing for user:', user);

    // Ensure WebSocket is connected
    if (!webSocketService.connected) {
      console.log('ChatPage: Connecting WebSocket...');
      webSocketService.connect(userData._id);
    }

    // Set initial connection status
    setConnectionStatus(webSocketService.connected ? 'online' : 'offline');

    // Handle connection status changes
    const handleConnectionStatus = (status) => {
      setConnectionStatus(status === 'connected' ? 'online' : 'offline');
    };

    // Handle new messages
    const handleNewMessage = (data) => {
      console.log('ChatPage: Received message:', data);
      
      // Only process messages for this chat
      if (data.senderId === user.id || (data.recipientId === userData._id && data.senderId === user.id)) {
        const newMessage = {
          id: data.id || Date.now(),
          text: data.message,
          sender: data.senderId === userData._id ? 'me' : 'other',
          timestamp: new Date(data.timestamp).toLocaleTimeString(),
          status: 'received'
        };

        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(msg => msg.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
        scrollToBottom();

        // Mark message as read if we're the recipient
        if (data.senderId === user.id && document.visibilityState === 'visible') {
          webSocketService.markMessageAsRead(user.id, data.id);
          webSocketService.updateActiveChat(user.id, {
            lastMessage: data.message,
            timestamp: data.timestamp,
            unreadCount: 0
          });
        }
      }
    };

    // Add listeners
    const unsubscribeConnectionStatus = webSocketService.addListener('connection-status', handleConnectionStatus);
    const unsubscribeNewMessage = webSocketService.addListener('new-message', handleNewMessage);
    
    // Load messages in this order:
    // 1. Try to get from active chats first (for real-time messages)
    // 2. If no messages found, request message history from server
    const loadMessages = async () => {
      // First try active chats
      const chatData = webSocketService.getActiveChats().find(chat => chat.userId === user.id);
      if (chatData && chatData.messages && chatData.messages.length > 0) {
        console.log('ChatPage: Loading existing messages from activeChats:', chatData.messages);
        setMessages(chatData.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp).toLocaleTimeString()
        })));
        // Mark all messages as read when opening the chat
        webSocketService.markMessageAsRead(user.id);
        webSocketService.updateActiveChat(user.id, { unreadCount: 0 });
        setTimeout(scrollToBottom, 100);
      } else {
        // No messages in active chats, request history from server
        console.log('ChatPage: Requesting message history from server');
        try {
          const response = await fetch(`/api/messages/history/${user.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const history = await response.json();
            console.log('ChatPage: Received message history:', history);
            
            if (history.messages && history.messages.length > 0) {
              const formattedMessages = history.messages.map(msg => ({
                id: msg._id,
                text: msg.content,
                sender: msg.sender === userData._id ? 'me' : 'other',
                timestamp: new Date(msg.timestamp).toLocaleTimeString(),
                status: 'received'
              }));
              
              setMessages(formattedMessages);
              setTimeout(scrollToBottom, 100);
              
              // Update active chats with historical messages
              webSocketService.updateActiveChat(user.id, {
                messages: formattedMessages,
                lastMessage: history.messages[history.messages.length - 1].content,
                timestamp: history.messages[history.messages.length - 1].timestamp,
                unreadCount: 0
              });
            }
          } else {
            console.error('Failed to fetch message history:', response.statusText);
          }
        } catch (error) {
          console.error('Error fetching message history:', error);
        }
      }
    };

    loadMessages();
    
    // Cleanup function
    return () => {
      console.log('ChatPage: Cleaning up for user:', user.id);
      unsubscribeConnectionStatus();
      unsubscribeNewMessage();
      // Update last seen when leaving the chat
      if (webSocketService.connected) {
        webSocketService.updateActiveChat(user.id, { lastSeen: new Date().toISOString() });
      }
    };
  }, [user.id, user.requesterId, user.deliveryOption, user.amount]); // Add user details to dependency array

  useEffect(() => {
    // Check if current user is the request user
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const userRequests = JSON.parse(localStorage.getItem('userRequests') || '[]');
    const isRequestUser = userRequests.some(request => 
      request.amount === user.amount && request.status === "pending"
    );
    setIsRequestUser(isRequestUser);
  }, [user.amount]);

  useEffect(() => {
    if (showMap && !mapRef.current) {
      // Load Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        // Calculate center point between both locations
        const centerLat = (currentLocation.latitude + user.latitude) / 2;
        const centerLng = (currentLocation.longitude + user.longitude) / 2;

        // Initialize map centered between both locations
        const map = L.map('map').setView([centerLat, centerLng], 15);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add marker for current user's location
        const currentMarker = L.marker([currentLocation.latitude, currentLocation.longitude], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div class="bg-blue-500 text-white rounded-full p-2">You</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          })
        })
        .addTo(map)
        .bindPopup('Your Location');

        // Add marker for request user's location
        const userMarker = L.marker([user.latitude, user.longitude], {
          icon: L.divIcon({
            className: 'custom-marker',
            html: `<div class="bg-emerald-500 text-white rounded-full p-2">${user.name}</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          })
        })
        .addTo(map)
        .bindPopup(`${user.name}'s Location`);

        // Draw a line between the points
        L.polyline([
          [currentLocation.latitude, currentLocation.longitude],
          [user.latitude, user.longitude]
        ], { 
          color: '#10B981',
          weight: 3,
          opacity: 0.7
        }).addTo(map);

        // Add distance information
        const distance = calculateDistance();
        L.popup()
          .setLatLng([centerLat, centerLng])
          .setContent(`Distance: ${distance}m`)
          .openOn(map);

        // Fit bounds to show both markers
        const bounds = L.latLngBounds([
          [currentLocation.latitude, currentLocation.longitude],
          [user.latitude, user.longitude]
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });

        // Store map instance
        mapRef.current = map;
      };
      document.head.appendChild(script);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [showMap, currentLocation, user]);

  const calculateDistance = () => {
    if (!user.latitude || !user.longitude) return 'N/A';
    // Calculate actual distance between currentLocation and user.location
    return Math.round(
      Math.sqrt(
        Math.pow(currentLocation.latitude - user.latitude, 2) +
        Math.pow(currentLocation.longitude - user.longitude, 2)
      ) * 111000 // Convert to meters (approximate)
    );
  };

  const handleDeliveryOptionSelect = (option) => {
    setDeliveryOption(option);
  };

  const handleConfirmDelivery = () => {
    setConfirmedDelivery(deliveryOption);
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: `Delivery option confirmed: ${deliveryOption === 'doorstep' ? 'Doorstep Delivery' : 'Meet at Location'}`,
      sender: 'system',
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const handleRemoveRequest = () => {
    const userRequests = JSON.parse(localStorage.getItem('userRequests') || '[]');
    const updatedRequests = userRequests.filter(request => 
      request.amount !== user.amount || request.status !== "pending"
    );
    localStorage.setItem('userRequests', JSON.stringify(updatedRequests));
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: "Request has been removed",
      sender: 'system',
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      const messageId = Date.now();
      const timestamp = new Date();
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      // Create message object for local state
      const messageObj = {
        id: messageId,
        text: newMessage,
        sender: 'me',
        timestamp: timestamp.toLocaleTimeString(),
        status: 'sending'
      };
      
      // Add to local state immediately for UI feedback
      setMessages(prev => [...prev, messageObj]);
      
      // Send via WebSocket
      const success = webSocketService.sendMessage(user.id, {
        message: newMessage,
        recipientId: user.id,
        senderId: userData._id,
        senderName: userData.name,
        timestamp: timestamp.toISOString(),
        requestId: user.requestId,
        amount: user.amount,
        deliveryOption: user.deliveryOption
      });
      
      if (!success) {
        // Update message status to error if send failed
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return { ...msg, status: 'error' };
          }
          return msg;
        }));
      } else {
        // Update message status to sent if successful
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return { ...msg, status: 'sent' };
          }
          return msg;
        }));
      }
      
      setNewMessage('');
      scrollToBottom();
    }
  };

  const startNavigation = () => {
    setIsNavigating(true);
    // Open Google Maps navigation in a new tab with correct origin and destination
    const origin = `${currentLocation.latitude},${currentLocation.longitude}`;
    const destination = `${user.latitude},${user.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
    window.open(url, '_blank');
  };

  // Add connection status indicator to the header
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
    // Only render if it's a cash request context (has deliveryOption and amount)
    if (!user.deliveryOption || !user.amount) return null;

    const isRequester = user.requesterId === userData._id;
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
            <h3 className="text-lg font-semibold text-gray-800">Money Details</h3> {/* Renamed for clarity */}
            <p className="text-sm text-gray-600">Requested by {isRequester ? 'you' : user.name}</p>
            <p className="text-sm text-gray-600">Select delivery option:</p> {/* Adjusted text */}
          </div>
          <div className="text-2xl font-bold text-emerald-600">₹{user.amount}</div>
        </div>

        {/* Display selected option clearly */}
        <div className={`w-full p-4 rounded-xl border-2 text-left mb-4 ${isRequester ? 'border-gray-300 bg-gray-50' : 'border-emerald-500 bg-emerald-50'}`}>
          <p className="font-semibold text-gray-800">
            {user.deliveryOption === 'doorstep' ? 'Doorstep Delivery' : 'Meet at Location'}
          </p>
          <p className="text-sm text-gray-500">
            {user.deliveryOption === 'doorstep' ? 'I will deliver to your location' : `Meet at ${user.location || 'College Campus'}`}
          </p>
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
            <Link to="/home" className="text-gray-600 hover:text-gray-800">
              <X size={24} />
            </Link>
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-12 h-12 rounded-full border-2 border-emerald-500"
            />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.department}</p>
              {renderConnectionStatus()}
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
        <div className="max-w-screen-xl mx-auto">
          {/* Connection Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-100 text-emerald-800 p-4 rounded-lg text-center mb-4"
          >
            You're connected with {user.name}
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Money Details and Chat */}
            <div className="space-y-4">
              {renderDeliverySection()}

              {/* Chat Messages */}
              <div className="space-y-2">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-3 rounded-lg ${
                      message.sender === 'me' 
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : message.sender === 'system'
                        ? 'bg-gray-100 text-gray-600 rounded-lg'
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                      <span className="text-xs opacity-75 mt-1 block">
                        {message.timestamp}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right Column - Map */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Location & Navigation</h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMap(!showMap)}
                  className="text-emerald-600 text-sm flex items-center gap-1"
                >
                  {showMap ? 'Hide Map' : 'Show Map'}
                  <NavigationIcon size={16} />
                </motion.button>
              </div>
              
              {showMap && (
                <div className="space-y-4">
                  <div className="h-[400px] bg-gray-100 rounded-lg overflow-hidden">
                    <div id="map" className="w-full h-full"></div>
                  </div>

                  {/* Navigation Controls */}
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={startNavigation}
                      className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <Play size={18} />
                      <span>Start Navigation</span>
                    </motion.button>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <NavigationIcon size={16} className="text-blue-600" />
                        <p className="text-sm text-blue-800">Navigation Instructions</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-blue-700">
                          Click "Start Navigation" to open Google Maps with walking directions to {user.name}'s location.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-blue-700">
                          <MapPin size={12} />
                          <span>Destination: {user.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-700">
                          <NavigationIcon size={12} />
                          <span>Distance: {calculateDistance()}m away</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!showMap && (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{user.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <NavigationIcon size={16} />
                      <span>{calculateDistance()}m away</span>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={startNavigation}
                    className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <Play size={18} />
                    <span>Start Navigation</span>
                  </motion.button>
                </div>
              )}
            </div>
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
              className="px-6 py-2 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 transition-colors duration-300 flex items-center gap-2"
            >
              <Send size={18} />
              <span>Send</span>
            </motion.button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage; 