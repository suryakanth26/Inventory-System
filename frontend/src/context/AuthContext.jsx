import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('arya_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('arya_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (token && user) {
      localStorage.setItem('arya_token', token);
      localStorage.setItem('arya_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('arya_token');
      localStorage.removeItem('arya_user');
    }
  }, [token, user]);

  const login = async (username, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.login(username, password);
      // Backend returns: { token, userId, username, role }
      const authenticatedUser = {
        id: data.userId,
        username: data.username,
        role: data.role || 'STAFF',
      };
      setToken(data.token);
      setUser(authenticatedUser);
      localStorage.setItem('arya_token', data.token);
      localStorage.setItem('arya_user', JSON.stringify(authenticatedUser));
      return { success: true, user: authenticatedUser };
    } catch (err) {
      let errorMsg = 'Invalid username or password';
      if (err.response?.data) {
        errorMsg = typeof err.response.data === 'string' ? err.response.data : (err.response.data.message || errorMsg);
      } else if (err.message) {
        errorMsg = err.message;
      }
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setAuthError(null);
    try {
      const data = await authApi.register(userData);
      return { success: true, data };
    } catch (err) {
      let errorMsg = 'Registration failed';
      if (err.response?.data) {
        errorMsg = typeof err.response.data === 'string' ? err.response.data : (err.response.data.message || errorMsg);
      }
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('arya_token');
    localStorage.removeItem('arya_user');
  };

  const value = {
    token,
    user,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'ADMIN',
    isManager: user?.role === 'MANAGER',
    isStaff: user?.role === 'STAFF',
    loading,
    authError,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
