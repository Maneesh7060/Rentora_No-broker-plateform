const pool = require('../config/db');

/**
 * Create a new notification
 */
const createNotification = async ({ userId, title, message, type = 'application', link = null }) => {
  const query = `
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [userId, title, message, type, link]);
  return rows[0];
};

/**
 * Get notifications for a user
 */
const getNotificationsByUser = async (userId, { limit = 30, offset = 0, unreadOnly = false } = {}) => {
  let query = `
    SELECT * FROM notifications
    WHERE user_id = $1
  `;
  const values = [userId];

  if (unreadOnly) {
    query += ` AND is_read = FALSE`;
  }

  query += ` ORDER BY created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);

  const { rows } = await pool.query(query, values);
  return rows;
};

/**
 * Mark a single notification as read
 */
const markNotificationAsRead = async (id, userId) => {
  const query = `
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [id, userId]);
  return rows[0] || null;
};

/**
 * Mark all notifications as read for a user
 */
const markAllNotificationsAsRead = async (userId) => {
  const query = `
    UPDATE notifications
    SET is_read = TRUE
    WHERE user_id = $1 AND is_read = FALSE
    RETURNING id;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows.length;
};

/**
 * Get count of unread notifications for a user
 */
const getUnreadCount = async (userId) => {
  const query = `
    SELECT COUNT(*)::int AS unread_count
    FROM notifications
    WHERE user_id = $1 AND is_read = FALSE;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows[0]?.unread_count || 0;
};

module.exports = {
  createNotification,
  getNotificationsByUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
};
