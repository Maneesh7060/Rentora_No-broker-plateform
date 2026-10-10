import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

/**
 * AuthProvider — manages authentication state across the entire application.
 * Provides: user, token, loading, login, register, logout, isAuthenticated.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('rentora_token'));
  const [loading, setLoading] = useState(true);

  // ========================================
  // On mount: if a token exists, verify it
  // ========================================
  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('rentora_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const result = await authService.getMe();
        setUser(result.data.user);
        setToken(storedToken);
      } catch {
        // Token is invalid or expired
        localStorage.removeItem('rentora_token');
        localStorage.removeItem('rentora_user');
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  // ========================================
  // Login
  // ========================================
  const login = useCallback(async (credentials) => {
    const result = await authService.login(credentials);
    const { token: newToken, user: loggedInUser } = result.data;
    localStorage.setItem('rentora_token', newToken);
    localStorage.setItem('rentora_user', JSON.stringify(loggedInUser));
    setToken(newToken);
    setUser(loggedInUser);
    return result;
  }, []);

  // ========================================
  // Register
  // ========================================
  const register = useCallback(async (data) => {
    const result = await authService.register(data);
    const { token: newToken, user: newUser } = result.data;
    localStorage.setItem('rentora_token', newToken);
    localStorage.setItem('rentora_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return result;
  }, []);

  // ========================================
  // Logout
  // ========================================
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Even if API call fails, clear local state
    }
    localStorage.removeItem('rentora_token');
    localStorage.removeItem('rentora_user');
    setToken(null);
    setUser(null);
  }, []);

  // ========================================
  // Update User state dynamically (e.g. avatar, name)
  // ========================================
  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUserData };
      localStorage.setItem('rentora_user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!token && !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to consume auth context.
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
