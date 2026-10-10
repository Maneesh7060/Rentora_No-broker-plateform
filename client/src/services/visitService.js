import api from './api';

/**
 * Visit Service for Rentora Frontend API interactions.
 */
export const visitService = {
  /**
   * Request an in-person property visit (Tenant)
   * @param {Object} data - { propertyId, visitDate, startTime, endTime, tenantMessage }
   */
  async requestVisit(data) {
    const response = await api.post('/visits', data);
    return response.data;
  },

  /**
   * Get available time slots for a property on a specific date (YYYY-MM-DD)
   * @param {Object} params - { propertyId, date }
   */
  async getAvailableSlots({ propertyId, date }) {
    const response = await api.get('/visits/availability', {
      params: { property_id: propertyId, date },
    });
    return response.data;
  },

  /**
   * Get authenticated tenant's visits
   * @param {Object} params - { status, page, limit }
   */
  async getMyVisits(params = {}) {
    const response = await api.get('/visits/my-visits', { params });
    return response.data;
  },

  /**
   * Get authenticated owner's received visit requests
   * @param {Object} params - { status, page, limit }
   */
  async getReceivedVisits(params = {}) {
    const response = await api.get('/visits/received', { params });
    return response.data;
  },

  /**
   * Get single visit details by ID
   * @param {string|number} id
   */
  async getVisitDetails(id) {
    const response = await api.get(`/visits/${id}`);
    return response.data;
  },

  /**
   * Approve or reject a visit request (Owner / Admin)
   * @param {string|number} id
   * @param {Object} data - { status: 'APPROVED' | 'REJECTED', ownerNotes }
   */
  async updateVisitStatus(id, data) {
    const response = await api.patch(`/visits/${id}/status`, data);
    return response.data;
  },

  /**
   * Cancel a pending visit request (Tenant)
   * @param {string|number} id
   */
  async cancelVisit(id) {
    const response = await api.patch(`/visits/${id}/cancel`);
    return response.data;
  },

  /**
   * Get owner's weekly availability schedule
   * @param {string|number} [propertyId]
   */
  async getOwnerAvailability(propertyId = null) {
    const response = await api.get('/visits/availability/owner', {
      params: propertyId ? { property_id: propertyId } : {},
    });
    return response.data;
  },

  /**
   * Update owner's weekly availability schedule
   * @param {Object} data - { schedule: Array, property_id }
   */
  async updateOwnerAvailability(data) {
    const response = await api.post('/visits/availability/owner', data);
    return response.data;
  },

  /**
   * Get quick statistics for tenant dashboard
   */
  async getTenantVisitStats() {
    const response = await api.get('/visits/tenant-stats');
    return response.data;
  },

  /**
   * Get quick statistics for owner dashboard
   */
  async getOwnerVisitStats() {
    const response = await api.get('/visits/owner-stats');
    return response.data;
  },
};

export default visitService;
