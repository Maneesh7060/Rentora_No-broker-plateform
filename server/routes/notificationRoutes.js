const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getUnreadNotificationCount,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');
const { protectRoute } = require('../middlewares/authMiddleware');

// All notification routes require authentication
router.use(protectRoute);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadNotificationCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

module.exports = router;
