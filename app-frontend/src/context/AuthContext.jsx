import { createContext, useState, useEffect } from 'react';
import { storeToken, getToken } from '../utils/tokenUtils';
import { getMe } from '../services/userApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = getToken();
      if (token) {
        try {
          setUser(await getMe());
        } catch (error) {
          console.error('Auth initialization failed:', error);
          storeToken(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    storeToken(token);
  };

  const logout = () => {
    setUser(null);
    storeToken(null);
    window.location.href = '/';
  };

  const refreshUser = async () => {
    if (!getToken()) return;
    try {
      setUser(await getMe());
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
