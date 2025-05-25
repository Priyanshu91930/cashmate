const isDevelopment = import.meta.env.MODE === 'development';

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3002'
  : 'https://cashmate-mo8a.onrender.com'; // Replace with your actual backend URL

export const API_ENDPOINTS = {
  login: '/api/auth/login',
  register: '/api/auth/register',
  checkUser: '/api/auth/check-existing-user',
  sendOtp: '/api/otp/send',
  verifyOtp: '/api/otp/verify'
}; 
