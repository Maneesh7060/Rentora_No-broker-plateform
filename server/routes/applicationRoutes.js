const express = require('express');
const router = express.Router();
const {
  applyForProperty,
  getMyApplications,
  getReceivedApplications,
  getApplicationDetails,
  updateStatus,
  withdrawApplication,
  getTenantDashboardStats,
  getOwnerDashboardStats,
} = require('../controllers/applicationController');
const { protectRoute } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// All application routes require authentication
router.use(protectRoute);

// Tenant routes
router.post('/', applyForProperty);
router.get('/my-applications', getMyApplications);
router.get('/tenant-stats', getTenantDashboardStats);
router.patch('/:id/withdraw', withdrawApplication);

// Owner routes
router.get('/received', requireRole('owner', 'admin'), getReceivedApplications);
router.get('/owner-stats', requireRole('owner', 'admin'), getOwnerDashboardStats);
router.patch('/:id/status', requireRole('owner', 'admin'), updateStatus);

// Shared / Details route
router.get('/:id', getApplicationDetails);

module.exports = router;
