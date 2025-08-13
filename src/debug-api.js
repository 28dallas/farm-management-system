// Debug API connection
console.log('Environment variables:');
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

import apiService from './services/api';

// Test the API service
const testAPI = async () => {
  console.log('API Base URL:', apiService.baseURL);
  
  try {
    console.log('Testing health check...');
    const health = await apiService.healthCheck();
    console.log('Health check success:', health);
  } catch (error) {
    console.error('Health check failed:', error);
  }
};

testAPI();