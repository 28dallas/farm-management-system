// Simple test to verify backend connection
const testConnection = async () => {
  const API_URL = 'https://farmbackend-ofsu.onrender.com';
  
  try {
    console.log('Testing health check...');
    const healthResponse = await fetch(`${API_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('Health check result:', healthData);
    
    console.log('Testing login...');
    const loginResponse = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'Nathan Krop',
        password: 'your_password_here'
      })
    });
    
    console.log('Login response status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Login result:', loginData);
    
  } catch (error) {
    console.error('Connection test failed:', error);
  }
};

testConnection();