const express = require('express');
const router = express.Router();
const {
  requestVisit,
  getAvailableSlots,
  getMyVisits,
  getReceivedVisits,
  getVisitDetails,
  updateStatus,
  cancelVisit,
  getOwnerAvailabilitySchedule,
  updateOwnerAvailabilitySchedule,
  getTenantStats,
  getOwnerStats,
} = require('../controllers/visitController');
const { protectRoute, optionalAuth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Public / Tenant slot lookup
router.get('/availability', optionalAuth, getAvailableSlots);

// All other routes require authentication
router.use(protectRoute);

// Tenant visit routes
router.post('/', requestVisit);
router.get('/my-visits', getMyVisits);
router.get('/tenant-stats', getTenantStats);
router.patch('/:id/cancel', cancelVisit);

// Owner visit & availability routes
router.get('/received', requireRole('owner', 'admin'), getReceivedVisits);
router.get('/owner-stats', requireRole('owner', 'admin'), getOwnerStats);
router.get('/availability/owner', requireRole('owner', 'admin'), getOwnerAvailabilitySchedule);
router.post('/availability/owner', requireRole('owner', 'admin'), updateOwnerAvailabilitySchedule);
router.put('/availability/owner', requireRole('owner', 'admin'), updateOwnerAvailabilitySchedule);
router.patch('/:id/status', requireRole('owner', 'admin'), updateStatus);

// Shared / Details route
router.get('/:id', getVisitDetails);

module.exports = router;
