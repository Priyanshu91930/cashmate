const express = require('express');
const router = express.Router();
const { initTwilio } = require('../config/twilio');

// Generate a 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTPs temporarily (in production, use Redis or a database)
const otpStore = new Map();

// Validate phone number format
function validatePhoneNumber(phoneNumber) {
    // Allow Indian phone numbers starting with +91 followed by 10 digits
    const phoneRegex = /^\+91[1-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
}

// Send OTP route
router.post('/send', async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        console.log('Received OTP request for:', phoneNumber);

        if (!phoneNumber) {
            return res.status(400).json({ 
                success: false,
                error: 'Phone number is required' 
            });
        }

        if (!validatePhoneNumber(phoneNumber)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid phone number format. Use format: +91XXXXXXXXXX' 
            });
        }

        // Generate OTP
        const otp = generateOTP();
        console.log('Generated OTP:', otp, 'for phone:', phoneNumber);
        
        // Store OTP with timestamp (expires in 5 minutes)
        otpStore.set(phoneNumber, {
            code: otp,
            expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
            attempts: 0
        });

        // Initialize Twilio
        const { client, phoneNumber: twilioNumber } = initTwilio();

        // Send OTP via SMS
        const message = await client.messages.create({
            body: `Your OTP for registration is: ${otp}. Valid for 5 minutes.`,
            from: twilioNumber,
            to: phoneNumber
        });

        console.log('OTP sent successfully:', {
            messageId: message.sid,
            status: message.status,
            phoneNumber: phoneNumber
        });

        res.json({ 
            success: true,
            message: 'OTP sent successfully'
        });

    } catch (error) {
        console.error('OTP Error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to send OTP',
            details: error.message 
        });
    }
});

// Verify OTP route
router.post('/verify', (req, res) => {
    const { phoneNumber, otp } = req.body;
    console.log('Verifying OTP for:', phoneNumber);

    if (!phoneNumber || !otp) {
        return res.status(400).json({ 
            success: false,
            error: 'Phone number and OTP are required' 
        });
    }

    if (!validatePhoneNumber(phoneNumber)) {
        return res.status(400).json({ 
            success: false,
            error: 'Invalid phone number format' 
        });
    }

    const storedOTP = otpStore.get(phoneNumber);
    console.log('Stored OTP data:', storedOTP);

    if (!storedOTP) {
        return res.status(400).json({ 
            success: false,
            error: 'No OTP found for this number' 
        });
    }

    if (Date.now() > storedOTP.expiresAt) {
        otpStore.delete(phoneNumber);
        return res.status(400).json({ 
            success: false,
            error: 'OTP has expired' 
        });
    }

    // Increment attempts
    storedOTP.attempts = (storedOTP.attempts || 0) + 1;

    // Check max attempts (3)
    if (storedOTP.attempts >= 3) {
        otpStore.delete(phoneNumber);
        return res.status(400).json({ 
            success: false,
            error: 'Too many attempts. Please request a new OTP.' 
        });
    }

    if (storedOTP.code !== otp) {
        return res.status(400).json({ 
            success: false,
            error: `Invalid OTP. ${3 - storedOTP.attempts} attempts remaining.` 
        });
    }

    // Clear the OTP after successful verification
    otpStore.delete(phoneNumber);
    console.log('OTP verified successfully for:', phoneNumber);

    res.json({ 
        success: true,
        message: 'OTP verified successfully'
    });
});

module.exports = router; 