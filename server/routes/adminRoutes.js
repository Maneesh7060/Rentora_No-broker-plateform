const express = require('express');
const {
  getStats,
  getProperties,
  getPropertyDetails,
  verifyProperty,
  getUsers,
  updateUserStatus,
  getDocuments,
  verifyDoc,
} = require('../controllers/adminController');
const { protectRoute } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

// Strict server-side Admin Protection: requires valid JWT token + 'admin' role
router.use(protectRoute);
router.use(requireRole('admin'));

// Admin Dashboard Stats
router.get('/stats', getStats);

// Admin Property Verification & Management
router.get('/properties', getProperties);
router.get('/properties/:id', getPropertyDetails);
router.patch('/properties/:id/verify', verifyProperty);

// Admin User Management
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);

// Admin Document Review
router.get('/documents', getDocuments);
router.patch('/documents/:id/verify', verifyDoc);

module.exports = router;
