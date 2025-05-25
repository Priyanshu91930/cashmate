import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, MapPin } from 'lucide-react';
import { listenToMessages, sendMessage, listenToChatRequests, acceptChatRequest } from '../services/chatService';

const Chat = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatUser, setChatUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const user = location.state?.user;
    if (!user) {
      navigate('/home');
      return;
    }
    setChatUser(user);

    // Get current user from session
    const currentUser = JSON.parse(sessionStorage.getItem('loginSession'));
    if (!currentUser) {
      navigate('/');
      return;
    }

    // Listen for chat requests
    const unsubscribeRequests = listenToChatRequests(currentUser.sessionId, (requests) => {
      const pendingRequest = requests.find(req => 
        req.fromUserId === userId && req.status === 'pending'
      );
      setIsConnected(!!pendingRequest);
    });

    // Listen for messages
    const unsubscribeMessages = listenToMessages(userId, (newMessages) => {
      setMessages(newMessages);
      scrollToBottom();
    });

    return () => {
      unsubscribeRequests();
      unsubscribeMessages();
    };
  }, [userId, location, navigate]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;

    try {
      await sendMessage(userId, chatUser.id, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    }
  };

  const handleAcceptRequest = async () => {
    try {
      await acceptChatRequest(userId);
      setIsConnected(true);
    } catch (error) {
      console.error('Error accepting chat request:', error);
      setError('Failed to accept chat request. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/home')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft size={24} />
        </motion.button>
        <div className="flex items-center gap-3">
          <img
            src={chatUser?.avatar}
            alt={chatUser?.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h2 className="font-semibold">{chatUser?.name}</h2>
            <p className="text-sm text-gray-500">{chatUser?.bio}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.userId === chatUser?.id ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.userId === chatUser?.id
                  ? 'bg-white shadow-sm'
                  : 'bg-blue-500 text-white'
              }`}
            >
              <p>{message.message}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(message.timestamp?.toDate()).toLocaleTimeString()}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 p-4 text-center">
          <p className="text-yellow-800">
            Waiting for connection...
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAcceptRequest}
              className="ml-2 text-blue-500 font-semibold"
            >
              Accept Request
            </motion.button>
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 p-4 text-center">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="bg-white p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!isConnected || !newMessage.trim()}
            className="bg-blue-500 text-white p-2 rounded-lg disabled:opacity-50"
          >
            <Send size={20} />
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default Chat; 