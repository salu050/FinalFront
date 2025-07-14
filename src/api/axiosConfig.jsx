// src/api/axiosConfig.js
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8080/api', // Your backend base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the JWT token to headers
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken'); // Get the token from local storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Add token to Authorization header
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration or 401/403 errors
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Token expired or unauthorized. Clear token and redirect to login.
      console.error("Authentication error:", error.response.status);
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('user');
      // Use window.location.href for full page reload to clear React state
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;