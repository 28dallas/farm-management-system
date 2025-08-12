const API_URL = 'http://localhost:5001';

class ApiService {
  constructor() {
    this.baseURL = API_URL;
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

    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    const response = await fetch(url, config);
    
    if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/signup')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      return;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async login(credentials) {
    return this.request('/api/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async signup(userData) {
    return this.request('/api/signup', {
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