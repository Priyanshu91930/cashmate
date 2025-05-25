import axios from 'axios';

// Detailed Axios configuration with relative URLs (using Vite proxy)
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3002',
  timeout: 15000, // 15 seconds timeout
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for logging and error handling
axiosInstance.interceptors.request.use(
  config => {
    console.log('Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  error => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
axiosInstance.interceptors.response.use(
  response => {
    console.log('Response:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  error => {
    console.error('Response Error:', error);
    if (error.response) {
      console.error('Server Response Error:', error.response);
    } else if (error.request) {
      console.error('No Response Error:', error.request);
    } else {
      console.error('Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;