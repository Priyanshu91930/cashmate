const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  clerkUserId: {
    type: String,
    unique: true,
    sparse: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true // This allows multiple documents to have null values
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  pdf: {
    type: String,
    default: ''
  },
  course: String,
  section: String,
  semester: String,
  fatherName: String,
  registrationStatus: {
    type: String,
    enum: ['pending', 'complete'],
    default: 'pending'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  connections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create a 2dsphere index for location-based queries
userSchema.index({ location: '2dsphere' });

// Specify the collection name as 'userauths'
module.exports = mongoose.model('User', userSchema, 'userauths'); 