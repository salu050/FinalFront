import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://localhost:8082/api', // Updated to HTTPS and new port 8443 with /api path
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
      // Clear token and user data immediately
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('user');

      // Dispatch a custom event to signal logout to the App component
      // This allows App.jsx to handle navigation using React Router's navigate
      window.dispatchEvent(new Event('auth-logout'));

      // Return a rejected promise to stop further processing of this request
      return Promise.reject(error);
    }
    // For other errors, just reject the promise as usual
    return Promise.reject(error);
  }
);

export default instance;