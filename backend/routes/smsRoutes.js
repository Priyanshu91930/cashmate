const express = require('express');
const router = express.Router();
const { initTwilio } = require('../config/twilio');

// Test route to send SMS
router.post('/test-sms', async (req, res) => {
    try {
        const { to } = req.body;
        
        if (!to) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const { client, phoneNumber } = initTwilio();

        const message = await client.messages.create({
            body: 'This is a test message from your application!',
            from: phoneNumber,
            to: to
        });

        res.json({ 
            success: true, 
            messageId: message.sid,
            status: message.status
        });
    } catch (error) {
        console.error('SMS Error:', error);
        res.status(500).json({ 
            error: 'Failed to send SMS',
            details: error.message 
        });
    }
});

module.exports = router; 