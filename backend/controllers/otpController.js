const { client, twilioPhoneNumber } = require('../config/twilio');

// Store OTPs temporarily (in production, use Redis or a database)
const otpStore = new Map();

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via Twilio
exports.sendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    // Validate phone number format
    if (!phoneNumber.match(/^\+[1-9]\d{1,14}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Please use international format (e.g., +91XXXXXXXXXX)'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with timestamp
    otpStore.set(phoneNumber, {
      otp,
      timestamp: Date.now(),
      attempts: 0
    });

    // Send OTP via Twilio
    await client.messages.create({
      body: `Your verification code is: ${otp}. Valid for 5 minutes.`,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP'
    });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    const storedData = otpStore.get(phoneNumber);
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this number. Please request a new OTP.'
      });
    }

    // Check if OTP is expired (5 minutes)
    if (Date.now() - storedData.timestamp > 5 * 60 * 1000) {
      otpStore.delete(phoneNumber);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Increment attempts
    storedData.attempts += 1;

    // Check max attempts (3)
    if (storedData.attempts >= 3) {
      otpStore.delete(phoneNumber);
      return res.status(400).json({
        success: false,
        message: 'Too many attempts. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Clear OTP after successful verification
    otpStore.delete(phoneNumber);

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
}; 