import axios from 'axios';

// Get base URL from environment variables, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Register a new user
 * @param {Object} userData - { fullName, email, phoneNumber, password }
 * @returns {Promise<Object>} Response data containing message and user details
 */
export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with a status other than 200 range
      if (error.response.status === 409) {
        throw new Error('An account already exists with this email address.');
      }
      throw new Error(error.response.data?.message || 'Registration failed. Please try again later.');
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('Unable to connect to the server. Check your internet connection.');
    } else {
      // Something happened in setting up the request
      throw new Error('Registration failed. Please try again later.');
    }
  }
};

/**
 * Login a user
 * @param {Object} credentials - { phoneNumber, password }
 * @returns {Promise<Object>} Response data containing token and user details
 */
export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.message || 'Invalid mobile number or password.');
    } else if (error.request) {
      throw new Error('Unable to connect to the server. Check your internet connection.');
    } else {
      throw new Error('Login failed. Please try again later.');
    }
  }
};
