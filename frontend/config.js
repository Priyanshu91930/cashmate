const isDevelopment = import.meta.env.MODE === 'development';

// Make sure this URL exactly matches your Render deployment URL
export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3002'
  : 'https://cashmate-backend.onrender.com';

export const API_ENDPOINTS = {
  login: '/api/auth/login',
  register: '/api/auth/register',
  checkUser: '/api/auth/check-existing-user',
  sendOtp: '/api/otp/send',
  verifyOtp: '/api/otp/verify'
}; 
