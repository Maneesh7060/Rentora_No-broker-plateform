const pool = require('../config/db');

/**
 * Add a property to user's wishlist
 */
const addToWishlist = async (userId, propertyId) => {
  const query = `
    INSERT INTO wishlists (user_id, property_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, property_id) DO NOTHING
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [userId, propertyId]);
  return rows[0] || null;
};

/**
 * Remove a property from user's wishlist
 */
const removeFromWishlist = async (userId, propertyId) => {
  const query = `
    DELETE FROM wishlists
    WHERE user_id = $1 AND property_id = $2
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [userId, propertyId]);
  return rows[0] || null;
};

/**
 * Get all wishlisted properties for a user
 */
const getWishlistByUser = async (userId) => {
  const query = `
    SELECT 
      w.id AS wishlist_id,
      w.created_at AS wishlisted_at,
      p.id,
      p.owner_id,
      p.title,
      p.description,
      p.property_type,
      p.furnishing,
      p.rent_amount,
      p.deposit_amount,
      p.bedrooms,
      p.bathrooms,
      p.area_sqft,
      p.address_line,
      p.locality,
      p.city,
      p.state,
      p.zip_code,
      p.latitude,
      p.longitude,
      p.amenities,
      p.images,
      p.status,
      p.created_at,
      u.full_name AS owner_name,
      u.email AS owner_email,
      u.phone AS owner_phone
    FROM wishlists w
    JOIN properties p ON w.property_id = p.id
    JOIN users u ON p.owner_id = u.id
    WHERE w.user_id = $1
    ORDER BY w.created_at DESC;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
};

/**
 * Get list of property IDs wishlisted by user (for quick UI matching)
 */
const getWishlistPropertyIds = async (userId) => {
  const query = `
    SELECT property_id FROM wishlists WHERE user_id = $1;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows.map((r) => r.property_id);
};

/**
 * Check if a specific property is in user's wishlist
 */
const isInWishlist = async (userId, propertyId) => {
  const query = `
    SELECT 1 FROM wishlists WHERE user_id = $1 AND property_id = $2 LIMIT 1;
  `;
  const { rows } = await pool.query(query, [userId, propertyId]);
  return rows.length > 0;
};

/**
 * Count items in user's wishlist
 */
const countUserWishlist = async (userId) => {
  const query = `
    SELECT COUNT(*)::int AS count FROM wishlists WHERE user_id = $1;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows[0]?.count || 0;
};

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getWishlistByUser,
  getWishlistPropertyIds,
  isInWishlist,
  countUserWishlist,
};
