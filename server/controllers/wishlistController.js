const {
  addToWishlist,
  removeFromWishlist,
  getWishlistByUser,
  getWishlistPropertyIds,
  isInWishlist,
} = require('../models/wishlistModel');
const { findPropertyById } = require('../models/propertyModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Get user's wishlisted properties
 * GET /api/v1/wishlist
 */
const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const wishlist = await getWishlistByUser(userId);
    return sendSuccess(res, 200, 'Wishlist retrieved successfully.', wishlist);
  } catch (err) {
    next(err);
  }
};

/**
 * Get array of wishlisted property IDs (for fast UI heart checks)
 * GET /api/v1/wishlist/ids
 */
const getWishlistIds = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const ids = await getWishlistPropertyIds(userId);
    return sendSuccess(res, 200, 'Wishlist IDs retrieved successfully.', ids);
  } catch (err) {
    next(err);
  }
};

/**
 * Add property to wishlist
 * POST /api/v1/wishlist/:propertyId
 */
const addPropertyToWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const propertyId = parseInt(req.params.propertyId, 10);

    if (isNaN(propertyId)) {
      return sendError(res, 400, 'Invalid property ID.');
    }

    const property = await findPropertyById(propertyId);
    if (!property) {
      return sendError(res, 404, 'Property not found.');
    }

    const added = await addToWishlist(userId, propertyId);
    return sendSuccess(res, 200, 'Property added to wishlist.', { propertyId, added: true });
  } catch (err) {
    next(err);
  }
};

/**
 * Remove property from wishlist
 * DELETE /api/v1/wishlist/:propertyId
 */
const removePropertyFromWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const propertyId = parseInt(req.params.propertyId, 10);

    if (isNaN(propertyId)) {
      return sendError(res, 400, 'Invalid property ID.');
    }

    await removeFromWishlist(userId, propertyId);
    return sendSuccess(res, 200, 'Property removed from wishlist.', { propertyId, removed: true });
  } catch (err) {
    next(err);
  }
};

/**
 * Toggle property in wishlist
 * POST /api/v1/wishlist/toggle/:propertyId
 */
const toggleWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const propertyId = parseInt(req.params.propertyId, 10);

    if (isNaN(propertyId)) {
      return sendError(res, 400, 'Invalid property ID.');
    }

    const alreadyIn = await isInWishlist(userId, propertyId);
    if (alreadyIn) {
      await removeFromWishlist(userId, propertyId);
      return sendSuccess(res, 200, 'Property removed from wishlist.', { propertyId, isWishlisted: false });
    } else {
      await addToWishlist(userId, propertyId);
      return sendSuccess(res, 200, 'Property added to wishlist.', { propertyId, isWishlisted: true });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getWishlist,
  getWishlistIds,
  addPropertyToWishlist,
  removePropertyFromWishlist,
  toggleWishlist,
};
