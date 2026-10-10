const pool = require('../config/db');

/**
 * Calculate honest profile completion percentage based on actual filled database fields.
 * @param {Object} user
 * @returns {Object} { percentage, completedCount, totalCount, missingFields }
 */
const calculateProfileCompletion = (user) => {
  if (!user) return { percentage: 0, completedCount: 0, totalCount: 8, missingFields: [] };

  const fields = [
    { key: 'full_name', label: 'Full name' },
    { key: 'email', label: 'Email address' },
    { key: 'phone', label: 'Phone number' },
    { key: 'avatar_url', label: 'Profile photo' },
    { key: 'bio', label: 'Bio / About me' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'address', label: 'Address' },
  ];

  const missingFields = [];
  let completedCount = 0;

  fields.forEach(({ key, label }) => {
    const val = user[key];
    if (val && String(val).trim().length > 0) {
      completedCount++;
    } else {
      missingFields.push(label);
    }
  });

  const percentage = Math.round((completedCount / fields.length) * 100);

  return {
    percentage,
    completedCount,
    totalCount: fields.length,
    missingFields,
  };
};

/**
 * Find a user by their email address.
 * @param {string} email
 * @returns {Promise<Object|null>} User row or null
 */
const findUserByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email]
  );
  return result.rows[0] || null;
};

/**
 * Find a user by their ID.
 * @param {number} id
 * @returns {Promise<Object|null>} User row or null
 */
const findUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, full_name, email, phone, role, avatar_url, bio, city, state, address, account_status, is_verified, created_at, updated_at
     FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Create a new user record.
 * @param {Object} userData - { full_name, email, password_hash, phone, role }
 * @returns {Promise<Object>} Newly created user row (without password_hash)
 */
const createUser = async ({ full_name, email, password_hash, phone, role = 'tenant' }) => {
  const result = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, phone, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, full_name, email, phone, role, avatar_url, bio, city, state, address, account_status, is_verified, created_at, updated_at`,
    [full_name, email, password_hash, phone || null, role]
  );
  return result.rows[0];
};

/**
 * Check if an email already exists in the users table.
 * @param {string} email
 * @returns {Promise<boolean>}
 */
const emailExists = async (email) => {
  const result = await pool.query(
    'SELECT 1 FROM users WHERE email = $1 LIMIT 1',
    [email]
  );
  return result.rowCount > 0;
};

/**
 * Update user profile details.
 * @param {number} id
 * @param {Object} data - { full_name, phone, bio, city, state, address, avatar_url }
 * @returns {Promise<Object>} Updated user record
 */
const updateUserProfile = async (id, data) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (data.full_name !== undefined) {
    fields.push(`full_name = $${paramIndex++}`);
    values.push(data.full_name);
  }
  if (data.phone !== undefined) {
    fields.push(`phone = $${paramIndex++}`);
    values.push(data.phone);
  }
  if (data.bio !== undefined) {
    fields.push(`bio = $${paramIndex++}`);
    values.push(data.bio);
  }
  if (data.city !== undefined) {
    fields.push(`city = $${paramIndex++}`);
    values.push(data.city);
  }
  if (data.state !== undefined) {
    fields.push(`state = $${paramIndex++}`);
    values.push(data.state);
  }
  if (data.address !== undefined) {
    fields.push(`address = $${paramIndex++}`);
    values.push(data.address);
  }
  if (data.avatar_url !== undefined) {
    fields.push(`avatar_url = $${paramIndex++}`);
    values.push(data.avatar_url);
  }

  if (fields.length === 0) {
    return findUserById(id);
  }

  values.push(id);
  const query = `
    UPDATE users
    SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex}
    RETURNING id, full_name, email, phone, role, avatar_url, bio, city, state, address, account_status, is_verified, created_at, updated_at
  `;

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Update user password hash.
 * @param {number} id
 * @param {string} passwordHash
 */
const updateUserPassword = async (id, passwordHash) => {
  await pool.query(
    `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [passwordHash, id]
  );
};

/**
 * Update user account status (ACTIVE vs SUSPENDED).
 * @param {number} id
 * @param {string} status - 'ACTIVE' | 'SUSPENDED'
 * @returns {Promise<Object>}
 */
const updateUserAccountStatus = async (id, status) => {
  const result = await pool.query(
    `UPDATE users SET account_status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, full_name, email, phone, role, avatar_url, account_status, is_verified, created_at, updated_at`,
    [status, id]
  );
  return result.rows[0];
};

/**
 * Get public safe profile of an owner/user without sensitive fields.
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const getPublicUserProfile = async (id) => {
  const userRes = await pool.query(
    `SELECT id, full_name, role, avatar_url, bio, city, state, is_verified, created_at
     FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  const user = userRes.rows[0];
  if (!user) return null;

  // If user is owner, count their published listings and fetch summary
  let propertiesCount = 0;
  let publicProperties = [];
  if (user.role === 'owner' || user.role === 'agent') {
    const propCountRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM properties WHERE owner_id = $1 AND status = 'published'`,
      [id]
    );
    propertiesCount = propCountRes.rows[0]?.count || 0;

    const propListRes = await pool.query(
      `SELECT id, title, property_type, rent_amount, bedrooms, bathrooms, area_sqft, locality, city, images, status, created_at
       FROM properties WHERE owner_id = $1 AND status = 'published' ORDER BY created_at DESC LIMIT 6`,
      [id]
    );
    publicProperties = propListRes.rows;
  }

  return {
    ...user,
    properties_count: propertiesCount,
    properties: publicProperties,
  };
};

/**
 * Admin: Get all users with search and role/status filtering.
 */
const getAllUsersForAdmin = async ({ role, account_status, search, page = 1, limit = 20 }) => {
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (role && role !== 'all') {
    conditions.push(`role = $${paramIdx++}`);
    params.push(role);
  }

  if (account_status && account_status !== 'all') {
    conditions.push(`account_status = $${paramIdx++}`);
    params.push(account_status);
  }

  if (search && search.trim()) {
    conditions.push(`(full_name ILIKE $${paramIdx} OR email ILIKE $${paramIdx} OR phone ILIKE $${paramIdx} OR city ILIKE $${paramIdx})`);
    params.push(`%${search.trim()}%`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*)::int AS total FROM users ${whereClause}`;
  const countRes = await pool.query(countQuery, params);
  const total = countRes.rows[0]?.total || 0;

  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);

  const query = `
    SELECT id, full_name, email, phone, role, avatar_url, bio, city, state, address, account_status, is_verified, created_at, updated_at
    FROM users
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;

  const result = await pool.query(query, params);

  return {
    users: result.rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

/**
 * Admin: Count total admins in the system.
 */
const countAdminUsers = async () => {
  const res = await pool.query(`SELECT COUNT(*)::int AS total FROM users WHERE role = 'admin' AND account_status = 'ACTIVE'`);
  return res.rows[0]?.total || 0;
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  emailExists,
  updateUserProfile,
  updateUserPassword,
  updateUserAccountStatus,
  getPublicUserProfile,
  getAllUsersForAdmin,
  countAdminUsers,
  calculateProfileCompletion,
};
