const express = require('express');
const router = express.Router();
const {
  getAllProperties,
  getProperty,
  getMyProperties,
  getOwnerStats,
  addProperty,
  updatePropertyDetails,
  removeProperty,
  uploadImages,
  updateImages,
  submitVerification,
} = require('../controllers/propertyController');
const { protectRoute, optionalAuth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { uploadPropertyImages } = require('../middlewares/uploadMiddleware');

// =============================================
// OWNER / ADMIN ROUTES
// Must be declared before parameterized /:id route
// =============================================
router.get('/owner/my-properties', protectRoute, requireRole('owner', 'admin'), getMyProperties);
router.get('/owner/stats', protectRoute, requireRole('owner', 'admin'), getOwnerStats);
router.post(
  '/upload-images',
  protectRoute,
  requireRole('owner', 'admin'),
  uploadPropertyImages.array('images', 10),
  uploadImages
);
router.patch(
  '/:id/images',
  protectRoute,
  requireRole('owner', 'admin'),
  updateImages
);
router.patch(
  '/:id/submit-verification',
  protectRoute,
  requireRole('owner', 'admin'),
  submitVerification
);

// =============================================
// PUBLIC & PROTECTED PROPERTY CRUD ROUTES
// =============================================

// GET /api/v1/properties - List published properties with search, filter, sort & pagination
router.get('/', getAllProperties);

// POST /api/v1/properties - Create property (Owner/Admin only)
router.post('/', protectRoute, requireRole('owner', 'admin'), addProperty);

// GET /api/v1/properties/:id - Get property details (Optional auth to allow owner/admin to view unpublished)
router.get('/:id', optionalAuth, getProperty);

// PUT /api/v1/properties/:id - Update property (Owner/Admin only)
router.put('/:id', protectRoute, requireRole('owner', 'admin'), updatePropertyDetails);

// DELETE /api/v1/properties/:id - Delete property (Owner/Admin only)
router.delete('/:id', protectRoute, requireRole('owner', 'admin'), removeProperty);

module.exports = router;
