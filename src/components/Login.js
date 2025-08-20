import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const Login = ({ onSwitchToSignup }) => {
  const { login, isAuthenticated } = useAuth();
  // Redirect to dashboard if already authenticated
  // No reload needed; App rerenders on isAuthenticated
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await apiService.login({ username, password });
      console.log('Login response:', response); // Debug log
      
      if (response && response.token) {
        const { token, ...userData } = response;
        setSuccess('Login successful! Redirecting...');
        login(userData, token);
      } else if (response) {
        // Handle response without token
        setSuccess('Login successful! Redirecting...');
        login(response, 'temp-token');
      } else {
        throw new Error('No response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 via-white to-blue-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-6 border border-gray-100">
        <div className="flex flex-col items-center mb-2">
          {/* Logo: you can replace this emoji with an <img src=... /> if you have a logo file */}
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-2 shadow-lg">
            <span className="text-3xl">🌾</span>
          </div>
          <span className="text-2xl font-bold text-green-700 tracking-wide">Farm Manager</span>
        </div>
        <h2 className="text-xl font-bold mb-2 text-center text-gray-800">Sign In</h2>
        {error && <div className="text-red-600 text-center">{error}</div>}
        {success && <div className="text-green-600 text-center">{success}</div>}
        <div>
          <label className="block mb-1 font-medium text-gray-700">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="border border-green-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-green-400"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border border-green-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-green-400"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold shadow"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <div className="text-center mt-2">
          <button type="button" className="text-green-700 underline" onClick={onSwitchToSignup}>
            Don&apos;t have an account? Sign Up
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
