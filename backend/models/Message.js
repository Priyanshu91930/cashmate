const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  participants: [{
    type: String,
    required: true
  }],
  messages: [{
    senderId: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create indexes for faster queries
messageSchema.index({ participants: 1 });
messageSchema.index({ lastUpdated: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message; 