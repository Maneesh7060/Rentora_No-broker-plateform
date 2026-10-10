const {
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
} = require('../models/notificationModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Get user's notifications
 * GET /api/v1/notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit, offset, unreadOnly } = req.query;

    const notifications = await getNotificationsByUser(userId, {
      limit: limit ? parseInt(limit, 10) : 30,
      offset: offset ? parseInt(offset, 10) : 0,
      unreadOnly: unreadOnly === 'true',
    });

    const unreadCount = await getUnreadCount(userId);

    return sendSuccess(res, 200, 'Notifications retrieved.', {
      notifications,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get unread notification count
 * GET /api/v1/notifications/unread-count
 */
const getUnreadNotificationCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const unreadCount = await getUnreadCount(userId);
    return sendSuccess(res, 200, 'Unread count retrieved.', { unreadCount });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark notification as read
 * PATCH /api/v1/notifications/:id/read
 */
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id, 10);

    const updated = await markNotificationAsRead(notificationId, userId);
    if (!updated) {
      return sendError(res, 404, 'Notification not found.');
    }

    return sendSuccess(res, 200, 'Notification marked as read.', updated);
  } catch (err) {
    next(err);
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/v1/notifications/read-all
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const count = await markAllNotificationsAsRead(userId);
    return sendSuccess(res, 200, `${count} notifications marked as read.`, { markedCount: count });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  getUnreadNotificationCount,
  markAsRead,
  markAllAsRead,
};
