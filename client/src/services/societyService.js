import api from './api';

/**
 * Fetch societies near a latitude & longitude within a radius in km
 * 
 * @param {Object} params
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {number} [params.radius=10]
 * @returns {Promise<Object>}
 */
export const getNearbySocieties = async ({ latitude, longitude, radius = 10, limit = 50 }) => {
  const response = await api.get('/societies/nearby', {
    params: {
      latitude,
      longitude,
      radius,
      limit,
    },
  });
  return response.data;
};

/**
 * Get details for a single society by ID
 */
export const getSocietyById = async (id) => {
  const response = await api.get(`/societies/${id}`);
  return response.data;
};

/**
 * Get list of all societies
 */
export const getAllSocieties = async (params = {}) => {
  const response = await api.get('/societies', { params });
  return response.data;
};

export default {
  getNearbySocieties,
  getSocietyById,
  getAllSocieties,
};
