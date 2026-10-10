import api from './api';

/**
 * Get all wishlisted properties for current user
 */
export const getWishlist = async () => {
  const response = await api.get('/wishlist');
  return response.data;
};

/**
 * Get array of wishlisted property IDs
 */
export const getWishlistIds = async () => {
  const response = await api.get('/wishlist/ids');
  return response.data;
};

/**
 * Toggle property in wishlist
 */
export const toggleWishlist = async (propertyId) => {
  const response = await api.post(`/wishlist/toggle/${propertyId}`);
  return response.data;
};

/**
 * Add property to wishlist
 */
export const addToWishlist = async (propertyId) => {
  const response = await api.post(`/wishlist/${propertyId}`);
  return response.data;
};

/**
 * Remove property from wishlist
 */
export const removeFromWishlist = async (propertyId) => {
  const response = await api.delete(`/wishlist/${propertyId}`);
  return response.data;
};
