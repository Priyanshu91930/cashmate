require('dotenv').config();
const twilio = require('twilio');

let client = null;
let phoneNumber = null;

function initTwilio() {
    if (!client) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        phoneNumber = process.env.TWILIO_PHONE_NUMBER;

        if (!accountSid || !authToken || !phoneNumber) {
            console.error('Twilio Configuration Error:', {
                accountSid: accountSid ? 'Set' : 'Missing',
                authToken: authToken ? 'Set' : 'Missing',
                phoneNumber: phoneNumber ? 'Set' : 'Missing'
            });
            throw new Error('Missing required Twilio credentials in environment variables');
        }

        try {
            client = twilio(accountSid, authToken);
            console.log('Twilio client initialized successfully');
        } catch (error) {
            console.error('Error initializing Twilio client:', error);
            throw error;
        }
    }
    return { client, phoneNumber };
}

module.exports = {
    initTwilio
}; 