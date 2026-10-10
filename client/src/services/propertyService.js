import api from './api';

/**
 * Property Service for Rentora Frontend API interactions.
 */
const propertyService = {
  /**
   * Fetch published properties with optional search, filters, sorting, and pagination.
   * @param {Object} params - { search, location, city, state, property_type, furnishing, minRent, maxRent, bedrooms, bathrooms, minArea, maxArea, sort, page, limit }
   * @param {Object} config - Axios request config (e.g. { signal })
   */
  async getProperties(params = {}, config = {}) {
    const cleanParams = {};
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'all') {
        if (Array.isArray(val)) {
          if (val.length > 0) cleanParams[key] = val;
        } else {
          cleanParams[key] = val;
        }
      }
    });

    const response = await api.get('/properties', {
      params: cleanParams,
      ...config,
    });
    return response.data;
  },

  /**
   * Fetch single property details by ID.
   * @param {string|number} id
   */
  async getPropertyById(id) {
    const response = await api.get(`/properties/${id}`);
    return response.data;
  },

  /**
   * Fetch authenticated owner's properties.
   * @param {Object} params - { status, search, sort }
   */
  async getMyProperties(params = {}) {
    const response = await api.get('/properties/owner/my-properties', { params });
    return response.data;
  },

  /**
   * Fetch owner property statistics.
   */
  async getOwnerStats() {
    const response = await api.get('/properties/owner/stats');
    return response.data;
  },

  /**
   * Create a new property listing (Owner / Admin only).
   * @param {Object} propertyData
   */
  async createProperty(propertyData) {
    const response = await api.post('/properties', propertyData);
    return response.data;
  },

  /**
   * Update an existing property listing (Owner / Admin only).
   * @param {string|number} id
   * @param {Object} propertyData
   */
  async updateProperty(id, propertyData) {
    const response = await api.put(`/properties/${id}`, propertyData);
    return response.data;
  },

  /**
   * Delete a property listing (Owner / Admin only).
   * @param {string|number} id
   */
  async deleteProperty(id) {
    const response = await api.delete(`/properties/${id}`);
    return response.data;
  },

  /**
   * Upload multiple property images.
   * @param {FormData} formData
   */
  async uploadImages(formData) {
    const response = await api.post('/properties/upload-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Update images list for a property (reorder, set primary, delete).
   * @param {string|number} id
   * @param {Array} images
   */
  async updateImages(id, images) {
    const response = await api.patch(`/properties/${id}/images`, { images });
    return response.data;
  },

  /**
   * Submit a draft property for admin verification.
   * @param {string|number} id
   */
  async submitVerification(id) {
    const response = await api.patch(`/properties/${id}/submit-verification`);
    return response.data;
  },
};

export default propertyService;
