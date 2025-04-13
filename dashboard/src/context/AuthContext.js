import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';

// Create auth context
const AuthContext = createContext();

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('solarbot_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state - check if token exists and is valid
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          // Attempt to get user profile with the token
          // In a real implementation, you'd have an endpoint like /api/auth/me
          // For now, we'll just simulate a successful auth if a token exists
          
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          setUser({
            id: 'user123',
            name: 'SolarBot User',
            email: 'user@solarbot.io',
            tier: 'professional'
          });
        } catch (err) {
          console.error('Failed to initialize auth:', err);
          localStorage.removeItem('solarbot_token');
          setToken(null);
          setError('Session expired. Please log in again.');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, this would call your API's login endpoint
      // const response = await apiService.login(email, password);
      
      // For demo purposes
      if (email === 'demo@solarbot.io' && password === 'demo123') {
        const demoToken = 'demo-token-' + Math.random().toString(36).substring(2);
        localStorage.setItem('solarbot_token', demoToken);
        setToken(demoToken);
        
        setUser({
          id: 'user123',
          name: 'SolarBot Demo User',
          email: 'demo@solarbot.io',
          tier: 'professional'
        });
        
        return { success: true };
      }
      
      // For easier testing, allow any login in this demo
      const mockToken = 'mock-token-' + Math.random().toString(36).substring(2);
      localStorage.setItem('solarbot_token', mockToken);
      setToken(mockToken);
      
      setUser({
        id: 'user' + Math.floor(Math.random() * 1000),
        name: 'SolarBot User',
        email: email,
        tier: 'professional'
      });
      
      return { success: true };
    } catch (err) {
      setError(err.message || 'Login failed');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('solarbot_token');
    setToken(null);
    setUser(null);
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      // In a real app, this would call your API
      // const response = await apiService.updateProfile(profileData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUser({ ...user, ...profileData });
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to update profile');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = !!token && !!user;

  // Context value
  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
