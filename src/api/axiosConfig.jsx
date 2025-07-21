// src/api/axiosConfig.jsx
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
      console.error("Authentication error caught by interceptor:", error.response.status);

      // --- START DEBUGGING ADDITION ---
      const tokenBeforeClear = localStorage.getItem('jwtToken');
      console.log("!!! DEBUG: JWT Token before clearing (due to 401/403):", tokenBeforeClear);
      const userBeforeClear = localStorage.getItem('user');
      console.log("!!! DEBUG: User data before clearing (due to 401/403):", userBeforeClear);
      // --- END DEBUGGING ADDITION ---

      // --- TEMPORARILY COMMENT OUT THESE LINES TO PREVENT REDIRECTION ---
      // Clear token and user data immediately
      // localStorage.removeItem('jwtToken');
      // localStorage.removeItem('user');
      
      // Dispatch a custom event to signal logout to the App component
      // window.dispatchEvent(new Event('auth-logout'));
      // --- END TEMPORARY COMMENT OUT ---

      // Return a rejected promise to stop further processing of this request
      return Promise.reject(error);
    }
    // For other errors, just reject the promise as usual
    return Promise.reject(error);
  }
);

export default instance;
