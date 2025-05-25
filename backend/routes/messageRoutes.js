const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const mongoose = require('mongoose');

// Send a new message
router.post('/', async (req, res) => {
  try {
    const { senderId, recipientId, message } = req.body;
    
    // Sort participants to ensure consistent order
    const participants = [senderId, recipientId].sort();
    
    // Find existing chat or create new one
    let chat = await Message.findOne({ participants });
    
    if (!chat) {
      chat = await Message.create({
        participants,
        messages: [{
          senderId,
          message,
          timestamp: new Date(),
          status: 'sent'
        }],
        lastUpdated: new Date()
      });
    } else {
      // Add new message to existing chat
      chat.messages.push({
        senderId,
        message,
        timestamp: new Date(),
        status: 'sent'
      });
      chat.lastUpdated = new Date();
      await chat.save();
    }

    // Return only the new message
    const newMessage = chat.messages[chat.messages.length - 1];
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get chat history between two users
router.get('/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    
    // Sort participants to ensure consistent order
    const participants = [userId, otherUserId].sort();
    
    // Find chat between these users
    const chat = await Message.findOne({ participants })
      .sort({ 'messages.timestamp': 1 })
      .lean();

    if (!chat) {
      return res.json([]); // Return empty array if no chat exists
    }

    // Transform messages to match the expected format
    const messages = chat.messages.map(msg => ({
      _id: msg._id,
      senderId: msg.senderId,
      recipientId: msg.senderId === userId ? otherUserId : userId,
      message: msg.message,
      timestamp: msg.timestamp,
      status: msg.status
    }));

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Mark messages as read
router.put('/read', async (req, res) => {
  try {
    const { senderId, recipientId } = req.body;
    
    // Sort participants to ensure consistent order
    const participants = [senderId, recipientId].sort();
    
    // Find chat and update unread messages
    const chat = await Message.findOne({ participants });
    
    if (chat) {
      chat.messages = chat.messages.map(msg => {
        if (msg.senderId === senderId && msg.status !== 'read') {
          msg.status = 'read';
        }
        return msg;
      });
      
      await chat.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

module.exports = router; 