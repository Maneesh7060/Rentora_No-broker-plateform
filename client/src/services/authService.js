import api from './api';

/**
 * Authentication service — wraps all auth API calls.
 */
const authService = {
  /**
   * Register a new user account.
   * @param {{ full_name: string, email: string, password: string, phone?: string, role?: string }} data
   */
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  /**
   * Login with email and password.
   * @param {{ email: string, password: string }} credentials
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Get the current authenticated user's profile.
   * Requires a valid JWT in localStorage.
   */
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Logout the current user.
   */
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

export default authService;
