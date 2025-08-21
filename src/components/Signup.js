
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';

const Signup = ({ onSwitchToLogin }) => {
  const { login, isAuthenticated } = useAuth();
  // Redirect to dashboard if already authenticated
  // No reload needed; App rerenders on isAuthenticated
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [success, setSuccess] = useState('');

  // Password validation checks
  const passwordChecks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[@$!%*?&]/.test(password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(check => check);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordTouched(true);
    
    // Client-side validation
    if (!isPasswordValid) {
      setError('Please fix the password requirements before submitting');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await apiService.signup({ username, password, email, displayName });
      const { token, ...userData } = response;
      
      setSuccess('Signup successful! Logging you in...');
      login(userData, token);
    } catch (err) {
      if (err.message.includes('Password must')) {
        setError('Password must be at least 8 characters with uppercase, lowercase, number and special character');
      } else {
        setError(err.message || 'Signup failed');
      }
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
        <h2 className="text-xl font-bold mb-2 text-center text-gray-800">Create Your Account</h2>
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
            onBlur={() => setPasswordTouched(true)}
            className={`border rounded px-3 py-2 w-full focus:ring-2 ${
              passwordTouched && !isPasswordValid 
                ? 'border-red-300 focus:ring-red-400' 
                : 'border-green-300 focus:ring-green-400'
            }`}
            required
          />
          {passwordTouched && (
            <div className="mt-2 text-sm text-gray-600">
              <p className="font-medium mb-1">Password must contain:</p>
              <ul className="space-y-1">
                <li className={`flex items-center ${passwordChecks.minLength ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="mr-2">{passwordChecks.minLength ? '✓' : '•'}</span>
                  At least 8 characters
                </li>
                <li className={`flex items-center ${passwordChecks.hasUppercase ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="mr-2">{passwordChecks.hasUppercase ? '✓' : '•'}</span>
                  One uppercase letter (A-Z)
                </li>
                <li className={`flex items-center ${passwordChecks.hasLowercase ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="mr-2">{passwordChecks.hasLowercase ? '✓' : '•'}</span>
                  One lowercase letter (a-z)
                </li>
                <li className={`flex items-center ${passwordChecks.hasNumber ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="mr-2">{passwordChecks.hasNumber ? '✓' : '•'}</span>
                  One number (0-9)
                </li>
                <li className={`flex items-center ${passwordChecks.hasSpecialChar ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="mr-2">{passwordChecks.hasSpecialChar ? '✓' : '•'}</span>
                  One special character (@$!%*?&)
                </li>
              </ul>
            </div>
          )}
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border border-green-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-700">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="border border-green-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-green-400"
          />
        </div>
        <button
          type="submit"
          className={`w-full py-2 rounded-lg font-semibold shadow ${
            loading || !isPasswordValid
              ? 'bg-gray-400 cursor-not-allowed text-gray-200'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
          disabled={loading || !isPasswordValid}
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
        <div className="text-center mt-2">
          <button type="button" className="text-green-700 underline" onClick={onSwitchToLogin}>
            Already have an account? Sign In
          </button>
        </div>
      </form>
    </div>
  );
};

export default Signup;
