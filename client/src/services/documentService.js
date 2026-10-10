import api from './api';

/**
 * Document Service for Rentora Frontend API interactions.
 */
export const documentService = {
  /**
   * Upload a rental document (PDF, PNG, JPG, WEBP).
   * @param {FormData} formData
   */
  async uploadDocument(formData) {
    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get documents uploaded by or accessible to current user.
   * @param {Object} params - { documentType, status }
   */
  async getMyDocuments(params = {}) {
    const response = await api.get('/documents/my-documents', { params });
    return response.data;
  },

  /**
   * Get single document details.
   * @param {string|number} id
   */
  async getDocument(id) {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  /**
   * Delete a document entry.
   * @param {string|number} id
   */
  async deleteDocument(id) {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  },
};

export default documentService;
