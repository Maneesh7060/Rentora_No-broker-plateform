import api from './api';

/**
 * User and Profile Service for Rentora Frontend API interactions.
 */
export const userService = {
  /**
   * Get current authenticated user profile with completion stats.
   */
  async getProfile() {
    const response = await api.get('/users/profile');
    return response.data;
  },

  /**
   * Update authenticated user profile fields.
   * @param {Object} data - { full_name, phone, bio, city, state, address }
   */
  async updateProfile(data) {
    const response = await api.patch('/users/profile', data);
    return response.data;
  },

  /**
   * Upload profile avatar photo.
   * @param {FormData} formData
   */
  async uploadAvatar(formData) {
    const response = await api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get public safe profile of a property owner / user.
   * @param {string|number} id
   */
  async getPublicProfile(id) {
    const response = await api.get(`/users/public/${id}`);
    return response.data;
  },

  /**
   * Change user password.
   * @param {Object} data - { currentPassword, newPassword, confirmPassword }
   */
  async changePassword(data) {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },
};

export default userService;
