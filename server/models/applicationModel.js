const pool = require('../config/db');

/**
 * Create a new rental application
 */
const createApplication = async ({
  propertyId,
  tenantId,
  ownerId,
  applicantName,
  phone,
  email,
  monthlyIncome,
  employmentStatus,
  occupation,
  occupants,
  moveInDate,
  message,
}) => {
  const query = `
    INSERT INTO rental_applications (
      property_id,
      tenant_id,
      owner_id,
      applicant_name,
      phone,
      email,
      monthly_income,
      employment_status,
      occupation,
      occupants,
      move_in_date,
      message,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
    RETURNING *;
  `;
  const values = [
    propertyId,
    tenantId,
    ownerId,
    applicantName,
    phone,
    email,
    monthlyIncome,
    employmentStatus || 'employed',
    occupation || null,
    occupants || 1,
    moveInDate,
    message || null,
  ];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Check if tenant already has an active pending application for a property
 */
const checkPendingApplication = async (tenantId, propertyId) => {
  const query = `
    SELECT * FROM rental_applications
    WHERE tenant_id = $1 AND property_id = $2 AND status = 'pending'
    LIMIT 1;
  `;
  const { rows } = await pool.query(query, [tenantId, propertyId]);
  return rows[0] || null;
};

/**
 * Find application by ID with joined property, owner, and tenant info
 */
const findApplicationById = async (id) => {
  const query = `
    SELECT 
      ra.*,
      p.title AS property_title,
      p.property_type,
      p.rent_amount,
      p.deposit_amount,
      p.address_line,
      p.locality,
      p.city,
      p.state,
      p.images AS property_images,
      p.status AS property_status,
      u_owner.full_name AS owner_name,
      u_owner.email AS owner_email,
      u_owner.phone AS owner_phone,
      u_tenant.full_name AS tenant_full_name,
      u_tenant.avatar_url AS tenant_avatar
    FROM rental_applications ra
    JOIN properties p ON ra.property_id = p.id
    JOIN users u_owner ON ra.owner_id = u_owner.id
    JOIN users u_tenant ON ra.tenant_id = u_tenant.id
    WHERE ra.id = $1;
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

/**
 * Find applications submitted by tenant
 */
const findApplicationsByTenant = async (tenantId, { status, limit = 50, offset = 0 } = {}) => {
  let query = `
    SELECT 
      ra.*,
      p.title AS property_title,
      p.property_type,
      p.rent_amount,
      p.deposit_amount,
      p.address_line,
      p.locality,
      p.city,
      p.images AS property_images,
      p.status AS property_status,
      u_owner.full_name AS owner_name,
      u_owner.email AS owner_email,
      u_owner.phone AS owner_phone
    FROM rental_applications ra
    JOIN properties p ON ra.property_id = p.id
    JOIN users u_owner ON ra.owner_id = u_owner.id
    WHERE ra.tenant_id = $1
  `;
  const values = [tenantId];

  if (status && status !== 'all') {
    values.push(status);
    query += ` AND ra.status = $${values.length}`;
  }

  query += ` ORDER BY ra.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);

  const { rows } = await pool.query(query, values);
  return rows;
};

/**
 * Find applications received by owner for their properties
 */
const findApplicationsByOwner = async (ownerId, { propertyId, status, limit = 50, offset = 0 } = {}) => {
  let query = `
    SELECT 
      ra.*,
      p.title AS property_title,
      p.property_type,
      p.rent_amount,
      p.deposit_amount,
      p.address_line,
      p.locality,
      p.city,
      p.images AS property_images,
      u_tenant.avatar_url AS tenant_avatar
    FROM rental_applications ra
    JOIN properties p ON ra.property_id = p.id
    JOIN users u_tenant ON ra.tenant_id = u_tenant.id
    WHERE ra.owner_id = $1
  `;
  const values = [ownerId];

  if (propertyId) {
    values.push(propertyId);
    query += ` AND ra.property_id = $${values.length}`;
  }

  if (status && status !== 'all') {
    values.push(status);
    query += ` AND ra.status = $${values.length}`;
  }

  query += ` ORDER BY ra.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);

  const { rows } = await pool.query(query, values);
  return rows;
};

/**
 * Update application status (approved, rejected, withdrawn) with optional owner notes
 */
const updateApplicationStatus = async (id, { status, ownerNotes }) => {
  const query = `
    UPDATE rental_applications
    SET 
      status = $1,
      owner_notes = COALESCE($2, owner_notes),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [status, ownerNotes || null, id]);
  return rows[0] || null;
};

/**
 * Tenant application stats (total, pending, approved, rejected)
 */
const countTenantApplications = async (tenantId) => {
  const query = `
    SELECT 
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
      COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
      COUNT(*) FILTER (WHERE status = 'withdrawn')::int AS withdrawn
    FROM rental_applications
    WHERE tenant_id = $1;
  `;
  const { rows } = await pool.query(query, [tenantId]);
  return rows[0];
};

/**
 * Owner application stats (total, pending, approved, rejected)
 */
const countOwnerApplications = async (ownerId) => {
  const query = `
    SELECT 
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
      COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected
    FROM rental_applications
    WHERE owner_id = $1;
  `;
  const { rows } = await pool.query(query, [ownerId]);
  return rows[0];
};

module.exports = {
  createApplication,
  checkPendingApplication,
  findApplicationById,
  findApplicationsByTenant,
  findApplicationsByOwner,
  updateApplicationStatus,
  countTenantApplications,
  countOwnerApplications,
};
