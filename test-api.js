// Quick API test
const testAPI = async () => {
  try {
    const response = await fetch('http://localhost:5001/api/health');
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

testAPI();