const API_URL = process.env.REACT_APP_API_URL || 'https://farmbackend-ofsu.onrender.com';

class ApiService {
  constructor() {
    this.baseURL = API_URL;
    this.maxRetries = 3;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isWakingUp = false;
    console.log('API Service initialized:', { baseURL: this.baseURL, isMobile: this.isMobile });
  }

  async wakeUpBackend() {
    if (this.isWakingUp) return;
    
    this.isWakingUp = true;
    console.log('Waking up backend server...');
    
    try {
      await Promise.race([
        fetch(`${this.baseURL}/api/health`, { 
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache'
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Wake-up timeout')), 45000)
        )
      ]);
      console.log('Backend is awake');
    } catch (error) {
      console.log('Wake-up attempt completed:', error.message);
    } finally {
      this.isWakingUp = false;
    }
  }

  async requestWithRetry(endpoint, options = {}, retryCount = 0) {
    try {
      return await this.request(endpoint, options);
    } catch (error) {
      if (retryCount < this.maxRetries && 
          (error.message.includes('Network error') || 
           error.message.includes('timeout') ||
           error.message.includes('Failed to fetch'))) {
        console.log(`Retry attempt ${retryCount + 1} for ${endpoint}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.requestWithRetry(endpoint, options, retryCount + 1);
      }
      throw error;
    }
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    console.log('API Request:', url);

    // Extended timeout for Render cold starts
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Server is starting up, please wait and try again')), 60000);
    });

    try {
      const config = {
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...this.getAuthHeaders()
        },
        ...options
      };

      console.log('Request config:', config);
      
      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(url, config),
        timeoutPromise
      ]);
      
      console.log('API Response status:', response.status);
      
      if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/signup')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `HTTP ${response.status}` };
        }
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      const responseText = await response.text();
      return responseText ? JSON.parse(responseText) : {};
    } catch (error) {
      console.error('Network/API Error:', error);
      
      // If it's a fetch failure, try to wake up the backend
      if ((error.name === 'TypeError' || error.message.includes('Failed to fetch')) && 
          !this.isWakingUp && (endpoint.includes('/login') || endpoint.includes('/signup'))) {
        console.log('Backend might be sleeping, attempting to wake up...');
        await this.wakeUpBackend();
        throw new Error('Server was sleeping. Please try again in a moment.');
      }
      
      if (error.message.includes('timeout') || error.message.includes('starting up')) {
        throw new Error('Server is starting up (this can take up to 60 seconds on first use). Please wait and try again.');
      }
      
      if (error.name === 'TypeError' || error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
        throw new Error('Unable to connect to server. Please check your internet connection and try again.');
      }
      
      throw error;
    }
  }

  async login(credentials) {
    return this.requestWithRetry('/api/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async signup(userData) {
    return this.requestWithRetry('/api/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async getIncome() {
    return this.request('/api/income');
  }

  async addIncome(data) {
    return this.request('/api/income', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getExpenses() {
    return this.request('/api/expenses');
  }

  async addExpense(data) {
    return this.request('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getProjects() {
    return this.request('/api/projects');
  }

  async addProject(data) {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getSummary() {
    return this.request('/api/summary');
  }

  async healthCheck() {
    return this.request('/api/health');
  }

  async getCrops() {
    return this.request('/api/crops');
  }

  async getInventory() {
    return this.request('/api/inventory');
  }
}

export default new ApiService();