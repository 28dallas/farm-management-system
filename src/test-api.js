// Test API connection
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

console.log('API URL:', API_URL);

// Test health endpoint
fetch(`${API_URL}/api/health`)
  .then(res => res.json())
  .then(data => console.log('Health check:', data))
  .catch(err => console.error('Health check failed:', err));

// Test login
fetch(`${API_URL}/api/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'adminpass' })
})
  .then(res => res.json())
  .then(data => console.log('Login test:', data))
  .catch(err => console.error('Login test failed:', err));