import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      localStorage.removeItem('user');
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = (userData, userToken) => {
    try {
      localStorage.setItem('token', userToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setToken(userToken);
      setError(null);
    } catch (error) {
      console.error('Error during login:', error);
      setError('Login failed');
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
      setError(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const value = {
    user,
    token,
    login,
    logout,
    getAuthHeaders,
    loading,
    error,
    setLoading,
    setError,
    isAuthenticated: !!(user && token)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};