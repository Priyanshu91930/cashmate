const Message = require('../models/Message');
const mongoose = require('mongoose');

const socketManager = (io) => {
  // Store active connections
  const activeConnections = new Map();
  
  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    console.log(`User connected: ${userId}`);

    if (userId) {
    activeConnections.set(userId, socket);
      socket.userId = userId;
    }
    
    // Notify others that this user is online
    socket.broadcast.emit('user-online', { userId });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.userId) {
        console.log(`User disconnected: ${socket.userId}`);
        activeConnections.delete(socket.userId);
      socket.broadcast.emit('user-offline', { userId });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${userId}:`, error);
      socket.emit('server-error', { message: 'An error occurred', error: error.message });
    });

    // Handle sending messages
    socket.on('send-message', async (data) => {
      try {
        const { recipientId, message } = data;
        
        // Sort participants to ensure consistent order
        const participants = [socket.userId, recipientId].sort();

        // Find existing chat or create new one
        let chat = await Message.findOne({ participants });
        
        if (!chat) {
          chat = await Message.create({
            participants,
            messages: [{
              senderId: socket.userId,
              message,
              timestamp: new Date(),
              status: 'sent'
            }],
            lastUpdated: new Date()
          });
        } else {
          // Add new message to existing chat
          chat.messages.push({
            senderId: socket.userId,
            message,
            timestamp: new Date(),
            status: 'sent'
          });
          chat.lastUpdated = new Date();
          await chat.save();
        }

        // Get the new message
        const newMessage = chat.messages[chat.messages.length - 1];

        console.log('Message saved to MongoDB:', newMessage);
        
        // Send to recipient if online
        const recipientSocket = activeConnections.get(recipientId);
        if (recipientSocket) {
          recipientSocket.emit('new-message', {
            messageId: newMessage._id,
            senderId: socket.userId,
            recipientId,
            message: newMessage.message,
            timestamp: newMessage.timestamp,
            status: 'delivered'
          });

          // Update message status to delivered
          chat.messages[chat.messages.length - 1].status = 'delivered';
          await chat.save();
        }

        // Send confirmation back to sender
        socket.emit('message-sent', {
          messageId: newMessage._id,
          status: recipientSocket ? 'delivered' : 'sent'
          });

      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    // Handle message read status
    socket.on('mark-read', async (data) => {
      try {
        const { senderId } = data;
        
        // Sort participants to ensure consistent order
        const participants = [socket.userId, senderId].sort();
        
        // Find chat and update message status
        const chat = await Message.findOne({ participants });
        
        if (chat) {
          chat.messages = chat.messages.map(msg => {
            if (msg.senderId === senderId && msg.status !== 'read') {
              msg.status = 'read';
            }
            return msg;
          });
          
          await chat.save();

          // Notify sender that messages were read
          const senderSocket = activeConnections.get(senderId);
          if (senderSocket) {
            senderSocket.emit('messages-read', { 
              by: socket.userId,
              timestamp: new Date()
        });
          }
        }

      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle connection requests
    socket.on('connection-request', (data) => {
      try {
        const { recipientId, ...requestData } = data;
        console.log('Connection request received:', {
          from: userId,
          to: recipientId,
          ...requestData
        });
        
        const recipientSocket = activeConnections.get(recipientId);
        if (recipientSocket) {
          recipientSocket.emit('connection-request', {
            fromUserId: userId,
            ...requestData
          });
          
          socket.emit('request-sent', {
            recipientId,
            timestamp: new Date().toISOString()
          });
        } else {
          socket.emit('request-error', {
            error: 'Recipient is offline',
            recipientId
          });
        }
      } catch (error) {
        console.error('Error handling connection request:', error);
        socket.emit('request-error', { error: error.message });
      }
    });

    // Handle connection acceptance
    socket.on('accept-connection', (data) => {
      try {
        const { requesterId, senderName, amount, requestId } = data;
        console.log('Connection acceptance received:', {
          from: userId,
          to: requesterId,
          senderName,
          amount,
          requestId
        });

        const requesterSocket = activeConnections.get(requesterId);
        console.log('Requester socket found:', !!requesterSocket);

        if (requesterSocket) {
          console.log('Sending connection acceptance to requester:', requesterId);
          requesterSocket.emit('connection-accepted', {
            fromUserId: userId,
            senderName,
            amount,
            requestId,
            timestamp: new Date().toISOString()
          });
        } else {
          console.log('Requester offline:', requesterId);
          socket.emit('accept-error', {
            error: 'Requester is offline',
            requesterId,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error handling connection acceptance:', error);
        socket.emit('accept-error', {
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle user typing status
    socket.on('typing-status', (data) => {
      try {
        const { recipientId, isTyping } = data;
        const recipientSocket = activeConnections.get(recipientId);

        if (recipientSocket) {
          recipientSocket.emit('user-typing', {
            userId,
            isTyping,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error handling typing status:', error);
      }
    });

    // Send initial online users list
    socket.emit('online-users', {
      users: Array.from(activeConnections.keys()),
      timestamp: new Date().toISOString()
    });
  });

  // Heartbeat to check connections every 30 seconds
  setInterval(() => {
    activeConnections.forEach((socket, userId) => {
      if (!socket.connected) {
        console.log(`Removing inactive connection for user: ${userId}`);
        activeConnections.delete(userId);
        io.emit('user-offline', { userId });
      }
    });
  }, 30000);
};

module.exports = socketManager; 