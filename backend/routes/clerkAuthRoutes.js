const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose');
const { Clerk } = require('@clerk/clerk-sdk-node');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Initialize Clerk with environment variable
const clerk = Clerk({
  apiKey: process.env.CLERK_SECRET_KEY
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter function
const fileFilter = (req, file, cb) => {
    console.log('File filter called for:', file.originalname, 'mimetype:', file.mimetype);
    if (file.fieldname === 'pdf') {
        // Accept PDFs only
        if (!file.mimetype.includes('pdf')) {
            return cb(new Error('Please upload a PDF file'), false);
        }
    }
    cb(null, true);
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Upload PDF file
router.post('/upload-pdf', (req, res, next) => {
    console.log('Upload PDF route hit');
    upload.single('pdf')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }
        next();
    });
}, async (req, res) => {
    try {
        console.log('Processing PDF upload:', req.file);
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No PDF file uploaded'
            });
        }

        // Create URL for the uploaded PDF
        const pdfUrl = `/uploads/${req.file.filename}`;
        console.log('PDF uploaded successfully:', pdfUrl);

        res.json({
            success: true,
            message: 'PDF uploaded successfully',
            pdfUrl
        });
    } catch (error) {
        console.error('Error in PDF upload route:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading PDF',
            error: error.message
        });
    }
});

// Check user route with comprehensive error handling
router.post('/check-user', async (req, res) => {
  try {
    const { clerkUserId, email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email and phone are required'
      });
    }

    // Check if user exists with either email or phone
    const existingUser = await User.findOne({
      $or: [
        { email: email },
        { phone: phone }
      ]
    });

    if (existingUser) {
      // If user exists but doesn't have clerkUserId, update it
      if (!existingUser.clerkUserId && clerkUserId) {
        existingUser.clerkUserId = clerkUserId;
        await existingUser.save();
      }

      return res.status(200).json({
        success: true,
        message: 'User found',
        user: {
          _id: existingUser._id,
          clerkUserId: existingUser.clerkUserId,
          name: existingUser.name,
          email: existingUser.email,
          phone: existingUser.phone,
          course: existingUser.course,
          section: existingUser.section,
          semester: existingUser.semester,
          fatherName: existingUser.fatherName,
          registrationStatus: existingUser.registrationStatus,
          profilePhoto: existingUser.profilePhoto,
          pdf: existingUser.pdf
        }
      });
    }

    // If no user found, return success: false
    return res.status(200).json({
      success: false,
      message: 'User not found'
    });
  } catch (error) {
    console.error('Error checking user:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Route to complete user profile
router.post('/complete-profile', async (req, res) => {
  try {
    const { 
      clerkUserId, 
      name,
      email,
      phone, 
      course, 
      section, 
      semester, 
      fatherName,
      pdf,
      password 
    } = req.body;

    console.log('Complete profile request:', { 
      clerkUserId, 
      name,
      email,
      phone, 
      course, 
      section, 
      semester, 
      fatherName,
      hasPdf: !!pdf,
      hasPassword: !!password
    });

    // Validate input
    if (!clerkUserId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing Clerk User ID' 
      });
    }

    // Validate required fields
    if (!phone || !course || !section || !semester || !fatherName || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Find user by Clerk User ID
    const user = await User.findOne({ clerkUserId });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user profile
    user.name = name;
    user.email = email;
    user.phone = phone;
    user.course = course;
    user.section = section;
    user.semester = semester;
    user.fatherName = fatherName;
    user.password = hashedPassword;
    if (pdf) {
      user.pdf = pdf;
    }

    // Set registration status to complete
    user.registrationStatus = 'complete';

    await user.save();

    console.log('Profile updated and marked complete:', {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      course: user.course,
      section: user.section,
      semester: user.semester,
      fatherName: user.fatherName,
      registrationStatus: user.registrationStatus,
      hasPdf: !!user.pdf
    });

    return res.status(200).json({
      success: true,
      message: 'Profile completed successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        course: user.course,
        section: user.section,
        semester: user.semester,
        fatherName: user.fatherName,
        registrationStatus: user.registrationStatus,
        pdf: user.pdf
      }
    });

  } catch (error) {
    console.error('Complete profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error completing profile',
      error: error.message 
    });
  }
});

module.exports = router; 