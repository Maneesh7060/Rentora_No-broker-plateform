const pool = require('../config/db');

/**
 * Valid document types and statuses
 */
const VALID_DOC_TYPES = [
  'IDENTITY',
  'ADDRESS_PROOF',
  'INCOME_PROOF',
  'PROPERTY_DOCUMENT',
  'RENTAL_DOCUMENT',
  'OTHER',
];

const VALID_DOC_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'];

/**
 * Create a new document entry in DB.
 */
const createDocument = async ({
  userId,
  propertyId = null,
  applicationId = null,
  documentType = 'IDENTITY',
  fileName,
  fileUrl,
  fileSize = null,
  mimeType = null,
}) => {
  const query = `
    INSERT INTO documents (
      user_id,
      property_id,
      application_id,
      document_type,
      file_name,
      file_url,
      file_size,
      mime_type,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
    RETURNING *
  `;

  const values = [
    userId,
    propertyId || null,
    applicationId || null,
    documentType,
    fileName,
    fileUrl,
    fileSize,
    mimeType,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Find document by ID with uploader and property info.
 */
const findDocumentById = async (id) => {
  const query = `
    SELECT 
      d.*,
      u.full_name AS user_name,
      u.email AS user_email,
      u.role AS user_role,
      p.title AS property_title,
      p.owner_id AS property_owner_id,
      ra.owner_id AS application_owner_id
    FROM documents d
    JOIN users u ON d.user_id = u.id
    LEFT JOIN properties p ON d.property_id = p.id
    LEFT JOIN rental_applications ra ON d.application_id = ra.id
    WHERE d.id = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

/**
 * Check if a user has permission to access/download a document.
 */
const canUserAccessDocument = (user, document) => {
  if (!user || !document) return false;
  if (user.role === 'admin') return true;
  if (document.user_id === user.id) return true;
  if (user.role === 'owner') {
    if (document.property_owner_id === user.id) return true;
    if (document.application_owner_id === user.id) return true;
  }
  return false;
};

/**
 * Get all documents uploaded by a specific user.
 */
const getDocumentsByUser = async (userId, filters = {}) => {
  const { documentType, status } = filters;
  const conditions = ['d.user_id = $1'];
  const values = [userId];
  let paramIdx = 2;

  if (documentType && documentType !== 'all') {
    conditions.push(`d.document_type = $${paramIdx++}`);
    values.push(documentType);
  }

  if (status && status !== 'all') {
    conditions.push(`d.status = $${paramIdx++}`);
    values.push(status);
  }

  const query = `
    SELECT 
      d.*,
      p.title AS property_title
    FROM documents d
    LEFT JOIN properties p ON d.property_id = p.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY d.uploaded_at DESC
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

/**
 * Get documents accessible to an owner (their own + applicant documents).
 */
const getDocumentsForOwner = async (ownerId, filters = {}) => {
  const query = `
    SELECT 
      d.*,
      u.full_name AS uploader_name,
      u.email AS uploader_email,
      p.title AS property_title
    FROM documents d
    JOIN users u ON d.user_id = u.id
    LEFT JOIN properties p ON d.property_id = p.id
    LEFT JOIN rental_applications ra ON d.application_id = ra.id
    WHERE d.user_id = $1 
       OR p.owner_id = $1 
       OR ra.owner_id = $1
    ORDER BY d.uploaded_at DESC
  `;
  const result = await pool.query(query, [ownerId]);
  return result.rows;
};

/**
 * Admin: Get all documents with filtering & pagination.
 */
const getAllDocumentsForAdmin = async ({ documentType, status, search, page = 1, limit = 20 }) => {
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (documentType && documentType !== 'all') {
    conditions.push(`d.document_type = $${paramIdx++}`);
    params.push(documentType);
  }

  if (status && status !== 'all') {
    conditions.push(`d.status = $${paramIdx++}`);
    params.push(status);
  }

  if (search && search.trim()) {
    conditions.push(`(d.file_name ILIKE $${paramIdx} OR u.full_name ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx} OR p.title ILIKE $${paramIdx})`);
    params.push(`%${search.trim()}%`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*)::int AS total 
    FROM documents d
    JOIN users u ON d.user_id = u.id
    LEFT JOIN properties p ON d.property_id = p.id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = countRes.rows[0]?.total || 0;

  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);

  const query = `
    SELECT 
      d.*,
      u.full_name AS user_name,
      u.email AS user_email,
      u.role AS user_role,
      p.title AS property_title
    FROM documents d
    JOIN users u ON d.user_id = u.id
    LEFT JOIN properties p ON d.property_id = p.id
    ${whereClause}
    ORDER BY d.uploaded_at DESC
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;

  const result = await pool.query(query, params);

  return {
    documents: result.rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

/**
 * Admin: Update document status (VERIFIED | REJECTED).
 */
const updateDocumentStatus = async (id, { status, rejectionReason = null }) => {
  const query = `
    UPDATE documents
    SET status = $1,
        rejection_reason = $2,
        verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING *
  `;
  const result = await pool.query(query, [status, rejectionReason || null, id]);
  return result.rows[0] || null;
};

/**
 * Delete a document by ID and user ID.
 */
const deleteDocument = async (id, userId) => {
  const result = await pool.query(
    'DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, userId]
  );
  return result.rows[0] || null;
};

module.exports = {
  VALID_DOC_TYPES,
  VALID_DOC_STATUSES,
  createDocument,
  findDocumentById,
  canUserAccessDocument,
  getDocumentsByUser,
  getDocumentsForOwner,
  getAllDocumentsForAdmin,
  updateDocumentStatus,
  deleteDocument,
};
