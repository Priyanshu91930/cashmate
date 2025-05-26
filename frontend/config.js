// Since backend is deployed on Render, we'll always use the production URL
export const API_BASE_URL = 'https://cashmate-backend.onrender.com';

export const API_ENDPOINTS = {
  login: '/api/auth/login',
  register: '/api/auth/register',
  checkUser: '/api/clerk-auth/check-user',
  sendOtp: '/api/otp/send',
  verifyOtp: '/api/otp/verify'
}; 
