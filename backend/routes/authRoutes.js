const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Login route
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt with body:', req.body);
        const { phone, password } = req.body;

        // Check if credentials are provided
        if (!phone || !password) {
            console.log('Missing credentials:', { phone: !!phone, password: !!password });
            return res.status(400).json({
                status: 'error',
                message: 'Please provide both phone number and password'
            });
        }

        // Clean and format phone number
        const cleanPhone = phone.replace(/[^0-9]/g, ''); // Remove any non-numeric characters
        const formattedPhone = cleanPhone.startsWith('91') 
            ? `+${cleanPhone}` 
            : `+91${cleanPhone}`;
        console.log('Formatted phone number:', formattedPhone);

        // Find user
        const user = await User.findOne({ phone: formattedPhone });
        console.log('User found:', !!user);

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid phone number or password'
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', isMatch);

        if (!isMatch) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid phone number or password'
            });
        }

        // Update user status
        user.isOnline = true;
        user.lastSeen = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        // Prepare user data for response
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            studentId: user.studentId,
            profilePhoto: user.profilePhoto,
            course: user.course,
            section: user.section,
            semester: user.semester,
            fatherName: user.fatherName,
            isOnline: user.isOnline,
            lastSeen: user.lastSeen
        };

        console.log('Sending success response:', { status: 'success', user: userData });
        
        return res.status(200).json({
            status: 'success',
            message: 'Login successful',
            user: userData,
            token: token
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred during login',
            error: error.message
        });
    }
});

// Logout route
router.post('/logout/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Update user's online status
        await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date()
        });

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during logout',
            error: error.message
        });
    }
});

router.post('/register', async (req, res) => {
    try {
        console.log('Registration attempt with body:', req.body);
        const { name, email, phone, password } = req.body;

        // Validate required fields
        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide all required fields'
            });
        }

        // Clean and format phone number
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const formattedPhone = cleanPhone.startsWith('91') 
            ? `+${cleanPhone}` 
            : `+91${cleanPhone}`;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email },
                { phone: formattedPhone }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: existingUser.email === email 
                    ? 'Email already registered' 
                    : 'Phone number already registered'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            name,
            email,
            phone: formattedPhone,
            password: hashedPassword,
            isOnline: true,
            lastSeen: new Date()
        });

        await user.save();

        // Prepare user data for response
        const userData = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            isOnline: user.isOnline,
            lastSeen: user.lastSeen
        };

        console.log('Registration successful:', userData);

        return res.status(201).json({
            status: 'success',
            message: 'Registration successful',
            user: userData
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred during registration',
            error: error.message
        });
    }
});

module.exports = router; 