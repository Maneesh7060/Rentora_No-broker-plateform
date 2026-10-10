const express = require('express');
const router = express.Router();
const {
  getWishlist,
  getWishlistIds,
  addPropertyToWishlist,
  removePropertyFromWishlist,
  toggleWishlist,
} = require('../controllers/wishlistController');
const { protectRoute } = require('../middlewares/authMiddleware');

// All wishlist routes require authentication
router.use(protectRoute);

router.get('/', getWishlist);
router.get('/ids', getWishlistIds);
router.post('/toggle/:propertyId', toggleWishlist);
router.post('/:propertyId', addPropertyToWishlist);
router.delete('/:propertyId', removePropertyFromWishlist);

module.exports = router;
