import api from './api';

/**
 * Admin Service for platform moderation, property verification, and user management.
 */
export const adminService = {
  /**
   * Get real platform statistics.
   */
  async getStats() {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  /**
   * Get properties for admin review with filters.
   * @param {Object} params - { verification_status, status, search, page, limit }
   */
  async getProperties(params = {}) {
    const response = await api.get('/admin/properties', { params });
    return response.data;
  },

  /**
   * Get single property details for review.
   * @param {string|number} id
   */
  async getPropertyDetails(id) {
    const response = await api.get(`/admin/properties/${id}`);
    return response.data;
  },

  /**
   * Approve or reject a property listing.
   * @param {string|number} id
   * @param {Object} data - { action: 'APPROVE' | 'REJECT', rejectionReason }
   */
  async verifyProperty(id, data) {
    const response = await api.patch(`/admin/properties/${id}/verify`, data);
    return response.data;
  },

  /**
   * Get all users for admin management.
   * @param {Object} params - { role, account_status, search, page, limit }
   */
  async getUsers(params = {}) {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  /**
   * Activate or suspend a user account.
   * @param {string|number} id
   * @param {Object} data - { status: 'ACTIVE' | 'SUSPENDED' }
   */
  async updateUserStatus(id, data) {
    const response = await api.patch(`/admin/users/${id}/status`, data);
    return response.data;
  },

  /**
   * Get documents for admin moderation.
   * @param {Object} params - { documentType, status, search, page, limit }
   */
  async getDocuments(params = {}) {
    const response = await api.get('/admin/documents', { params });
    return response.data;
  },

  /**
   * Verify or reject an uploaded document.
   * @param {string|number} id
   * @param {Object} data - { status: 'VERIFIED' | 'REJECTED', rejectionReason }
   */
  async verifyDocument(id, data) {
    const response = await api.patch(`/admin/documents/${id}/verify`, data);
    return response.data;
  },
};

export default adminService;
