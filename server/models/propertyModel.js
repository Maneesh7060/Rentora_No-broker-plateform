const pool = require('../config/db');

/**
 * Valid property types, statuses and furnishing
 */
const VALID_TYPES = ['apartment', 'house', 'villa', 'studio', 'commercial'];
const VALID_STATUSES = [
  'draft',
  'pending_verification',
  'pending',
  'published',
  'verified',
  'active',
  'rejected',
  'rented',
  'inactive',
];
const VALID_FURNISHING = ['unfurnished', 'semi_furnished', 'fully_furnished'];

/**
 * Get published properties with natural search, multi-field filtering, radius distance, sorting, and pagination.
 * 
 * @param {Object} filters
 * @returns {Promise<{ properties: Array, total: number, page: number, limit: number, totalPages: number }>}
 */
const getPublishedProperties = async (filters = {}) => {
  const {
    keyword,
    search,
    location,
    locality,
    city,
    state,
    property_type,
    propertyType,
    furnishing,
    minRent,
    maxRent,
    bedrooms,
    bathrooms,
    minArea,
    maxArea,
    amenities,
    society_id,
    societyId,
    society,
    latitude,
    longitude,
    radius = 35, // default radius 35 km for location-based search
    sort = 'newest',
    page = 1,
    limit = 12,
  } = filters;

  // Public listings must be published / verified / active
  const conditions = ["p.status IN ('published', 'verified', 'active')"];
  const whereValues = [];
  let paramIndex = 1;

  const searchQuery = (keyword || search || '').trim();
  const locQuery = (location || locality || '').trim();
  const typeQuery = (property_type || propertyType || '').trim().toLowerCase();
  const sId = parseInt(society_id || societyId, 10);
  const hasSocietyId = !isNaN(sId) && sId > 0;

  // Society ID or Society Name Filter
  if (hasSocietyId) {
    conditions.push(`p.society_id = $${paramIndex}`);
    whereValues.push(sId);
    paramIndex++;
  } else if (society && society.trim() && society.trim().toLowerCase() !== 'all') {
    conditions.push(`(s.name ILIKE $${paramIndex} OR p.title ILIKE $${paramIndex})`);
    whereValues.push(`%${society.trim()}%`);
    paramIndex++;
  }

  // Search keyword across title, locality, city, address_line, state, description, and society name
  if (searchQuery) {
    if (hasSocietyId) {
      conditions.push(
        `(p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.locality ILIKE $${paramIndex} OR s.name ILIKE $${paramIndex} OR p.city ILIKE $${paramIndex})`
      );
      whereValues.push(`%${searchQuery}%`);
      paramIndex++;
    } else {
      conditions.push(
        `(p.title ILIKE $${paramIndex} OR p.locality ILIKE $${paramIndex} OR p.city ILIKE $${paramIndex} OR p.address_line ILIKE $${paramIndex} OR p.state ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`
      );
      whereValues.push(`%${searchQuery}%`);
      paramIndex++;
    }
  }

  // Locality / Location specific filter (only when not filtering by specific society_id)
  if (!hasSocietyId && locQuery && locQuery.toLowerCase() !== searchQuery.toLowerCase()) {
    conditions.push(
      `(p.locality ILIKE $${paramIndex} OR p.city ILIKE $${paramIndex} OR p.address_line ILIKE $${paramIndex})`
    );
    whereValues.push(`%${locQuery}%`);
    paramIndex++;
  }

  // City filter (only when not filtering by specific society_id)
  if (
    !hasSocietyId &&
    city &&
    city.trim() &&
    city.trim().toLowerCase() !== searchQuery.toLowerCase() &&
    city.trim().toLowerCase() !== locQuery.toLowerCase()
  ) {
    conditions.push(`p.city ILIKE $${paramIndex}`);
    whereValues.push(`%${city.trim()}%`);
    paramIndex++;
  }

  // State filter
  if (state && state.trim()) {
    conditions.push(`p.state ILIKE $${paramIndex}`);
    whereValues.push(`%${state.trim()}%`);
    paramIndex++;
  }

  // Property type filter (normalize 'flat' to 'apartment')
  if (typeQuery && typeQuery !== 'all') {
    let normalizedType = typeQuery;
    if (normalizedType === 'flat') normalizedType = 'apartment';
    if (VALID_TYPES.includes(normalizedType)) {
      conditions.push(`p.property_type = $${paramIndex}`);
      whereValues.push(normalizedType);
      paramIndex++;
    }
  }

  // Furnishing filter
  if (furnishing && furnishing.trim() && furnishing.toLowerCase() !== 'all') {
    const normalizedFurnishing = furnishing.trim().toLowerCase();
    if (VALID_FURNISHING.includes(normalizedFurnishing)) {
      conditions.push(`p.furnishing = $${paramIndex}`);
      whereValues.push(normalizedFurnishing);
      paramIndex++;
    }
  }

  // Min Rent
  if (minRent !== undefined && minRent !== '' && !isNaN(Number(minRent))) {
    conditions.push(`p.rent_amount >= $${paramIndex}`);
    whereValues.push(Number(minRent));
    paramIndex++;
  }

  // Max Rent
  if (maxRent !== undefined && maxRent !== '' && !isNaN(Number(maxRent))) {
    conditions.push(`p.rent_amount <= $${paramIndex}`);
    whereValues.push(Number(maxRent));
    paramIndex++;
  }

  // Bedrooms filter
  if (bedrooms !== undefined && bedrooms !== '' && !isNaN(Number(bedrooms))) {
    const bedVal = Number(bedrooms);
    if (bedVal >= 5) {
      conditions.push(`p.bedrooms >= $${paramIndex}`);
      whereValues.push(5);
    } else {
      conditions.push(`p.bedrooms = $${paramIndex}`);
      whereValues.push(bedVal);
    }
    paramIndex++;
  }

  // Bathrooms filter
  if (bathrooms !== undefined && bathrooms !== '' && !isNaN(Number(bathrooms))) {
    const bathVal = Number(bathrooms);
    if (bathVal >= 4) {
      conditions.push(`p.bathrooms >= $${paramIndex}`);
      whereValues.push(4);
    } else {
      conditions.push(`p.bathrooms = $${paramIndex}`);
      whereValues.push(bathVal);
    }
    paramIndex++;
  }

  // Min Area
  if (minArea !== undefined && minArea !== '' && !isNaN(Number(minArea))) {
    conditions.push(`p.area_sqft >= $${paramIndex}`);
    whereValues.push(Number(minArea));
    paramIndex++;
  }

  // Max Area
  if (maxArea !== undefined && maxArea !== '' && !isNaN(Number(maxArea))) {
    conditions.push(`p.area_sqft <= $${paramIndex}`);
    whereValues.push(Number(maxArea));
    paramIndex++;
  }

  // Amenities filter (all selected amenities must be present)
  if (amenities) {
    const amenitiesArr = Array.isArray(amenities)
      ? amenities
      : String(amenities).split(',').map((a) => a.trim()).filter(Boolean);

    if (amenitiesArr.length > 0) {
      conditions.push(`p.amenities @> $${paramIndex}::jsonb`);
      whereValues.push(JSON.stringify(amenitiesArr));
      paramIndex++;
    }
  }

  // Geographic distance filtering
  const hasGeo = latitude !== undefined && longitude !== undefined && !isNaN(Number(latitude)) && !isNaN(Number(longitude));
  if (hasGeo) {
    const parsedLat = Number(latitude);
    const parsedLng = Number(longitude);
    const parsedRad = Number(radius) || 35;

    const latIndex = paramIndex;
    const lngIndex = paramIndex + 1;
    const radIndex = paramIndex + 2;

    conditions.push(`
      p.latitude IS NOT NULL 
      AND p.longitude IS NOT NULL
      AND (
        6371 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians($${latIndex})) * cos(radians(p.latitude)) *
            cos(radians(p.longitude) - radians($${lngIndex})) +
            sin(radians($${latIndex})) * sin(radians(p.latitude))
          ))
        )
      ) <= $${radIndex}
    `);
    whereValues.push(parsedLat, parsedLng, parsedRad);
    paramIndex += 3;
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Total count query
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM properties p
    JOIN users u ON p.owner_id = u.id
    LEFT JOIN societies s ON p.society_id = s.id
    ${whereClause}
  `;
  const countResult = await pool.query(countQuery, whereValues);
  const total = parseInt(countResult.rows[0].total, 10);

  // Pagination calculation
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
  const offset = (parsedPage - 1) * parsedLimit;
  const totalPages = Math.ceil(total / parsedLimit);

  // Build Distance formula select
  let distanceSelect = 'NULL::numeric AS distance_km';
  const dataValues = [...whereValues];
  let dataParamIdx = paramIndex;

  if (hasGeo) {
    const latIdx = dataParamIdx;
    const lngIdx = dataParamIdx + 1;
    dataValues.push(Number(latitude), Number(longitude));
    dataParamIdx += 2;

    distanceSelect = `
      CASE 
        WHEN p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN
          ROUND((
            6371 * acos(
              LEAST(1.0, GREATEST(-1.0,
                cos(radians($${latIdx})) * cos(radians(p.latitude)) *
                cos(radians(p.longitude) - radians($${lngIdx})) +
                sin(radians($${latIdx})) * sin(radians(p.latitude))
              ))
            )
          )::numeric, 2)
        ELSE NULL
      END AS distance_km
    `;
  }

  // Sorting
  let orderByClause = 'ORDER BY p.created_at DESC';
  if (sort === 'rent_low') {
    orderByClause = 'ORDER BY p.rent_amount ASC, p.created_at DESC';
  } else if (sort === 'rent_high') {
    orderByClause = 'ORDER BY p.rent_amount DESC, p.created_at DESC';
  } else if (sort === 'oldest') {
    orderByClause = 'ORDER BY p.created_at ASC';
  } else if (sort === 'bedrooms') {
    orderByClause = 'ORDER BY p.bedrooms DESC, p.created_at DESC';
  } else if (sort === 'distance' && hasGeo) {
    orderByClause = 'ORDER BY distance_km ASC NULLS LAST, p.created_at DESC';
  }

  const limitParamIdx = dataParamIdx;
  const offsetParamIdx = dataParamIdx + 1;
  dataValues.push(parsedLimit, offset);

  const dataQuery = `
    SELECT 
      p.id,
      p.owner_id,
      p.society_id,
      s.name AS society_name,
      s.locality AS society_locality,
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
      p.verification_status,
      p.created_at,
      p.updated_at,
      ${distanceSelect},
      json_build_object(
        'id', u.id,
        'full_name', u.full_name,
        'email', u.email,
        'phone', u.phone,
        'avatar_url', u.avatar_url,
        'is_verified', u.is_verified
      ) AS owner
    FROM properties p
    JOIN users u ON p.owner_id = u.id
    LEFT JOIN societies s ON p.society_id = s.id
    ${whereClause}
    ${orderByClause}
    LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}
  `;

  const dataResult = await pool.query(dataQuery, dataValues);

  return {
    properties: dataResult.rows,
    total,
    page: parsedPage,
    limit: parsedLimit,
    totalPages,
  };
};

/**
 * Find property by ID (with owner details).
 */
const findPropertyById = async (id) => {
  const query = `
    SELECT 
      p.id,
      p.owner_id,
      p.society_id,
      s.name AS society_name,
      s.locality AS society_locality,
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
      p.verification_status,
      p.rejection_reason,
      p.verified_at,
      p.created_at,
      p.updated_at,
      json_build_object(
        'id', u.id,
        'full_name', u.full_name,
        'email', u.email,
        'phone', u.phone,
        'avatar_url', u.avatar_url,
        'is_verified', u.is_verified,
        'created_at', u.created_at
      ) AS owner
    FROM properties p
    JOIN users u ON p.owner_id = u.id
    LEFT JOIN societies s ON p.society_id = s.id
    WHERE p.id = $1
    LIMIT 1
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
};

/**
 * Get all properties owned by a specific owner (all statuses).
 */
const getPropertiesByOwnerId = async (ownerId, options = {}) => {
  const { status, search, sort = 'newest' } = options;
  const conditions = ['p.owner_id = $1'];
  const values = [ownerId];
  let paramIndex = 2;

  if (status && status.trim() && status.toLowerCase() !== 'all') {
    conditions.push(`(p.status = $${paramIndex} OR p.verification_status = $${paramIndex})`);
    values.push(status.trim().toLowerCase());
    paramIndex++;
  }

  if (search && search.trim()) {
    conditions.push(`(p.title ILIKE $${paramIndex} OR p.locality ILIKE $${paramIndex} OR p.city ILIKE $${paramIndex} OR p.address_line ILIKE $${paramIndex})`);
    values.push(`%${search.trim()}%`);
    paramIndex++;
  }

  let orderBy = 'ORDER BY p.created_at DESC';
  if (sort === 'rent_low') orderBy = 'ORDER BY p.rent_amount ASC';
  if (sort === 'rent_high') orderBy = 'ORDER BY p.rent_amount DESC';
  if (sort === 'title') orderBy = 'ORDER BY p.title ASC';

  const query = `
    SELECT 
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
      p.verification_status,
      p.rejection_reason,
      p.created_at,
      p.updated_at
    FROM properties p
    WHERE ${conditions.join(' AND ')}
    ${orderBy}
  `;

  const result = await pool.query(query, values);
  return result.rows;
};

/**
 * Create a new property record.
 */
const createProperty = async (propertyData) => {
  const {
    owner_id,
    title,
    description = '',
    property_type = 'apartment',
    furnishing = 'unfurnished',
    rent_amount,
    deposit_amount = 0,
    bedrooms = 1,
    bathrooms = 1,
    area_sqft = null,
    address_line,
    locality = null,
    city,
    state,
    zip_code,
    latitude = null,
    longitude = null,
    amenities = [],
    images = [],
    status = 'draft',
    verification_status = 'pending_verification',
  } = propertyData;

  const query = `
    INSERT INTO properties (
      owner_id,
      title,
      description,
      property_type,
      furnishing,
      rent_amount,
      deposit_amount,
      bedrooms,
      bathrooms,
      area_sqft,
      address_line,
      locality,
      city,
      state,
      zip_code,
      latitude,
      longitude,
      amenities,
      images,
      status,
      verification_status
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
    )
    RETURNING *
  `;

  const values = [
    owner_id,
    title,
    description,
    property_type,
    furnishing,
    rent_amount,
    deposit_amount,
    bedrooms,
    bathrooms,
    area_sqft,
    address_line,
    locality || null,
    city,
    state,
    zip_code,
    latitude,
    longitude,
    JSON.stringify(Array.isArray(amenities) ? amenities : []),
    JSON.stringify(Array.isArray(images) ? images : []),
    status,
    verification_status,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Update an existing property record.
 */
const updateProperty = async (id, updateData) => {
  const allowedFields = [
    'title',
    'description',
    'property_type',
    'furnishing',
    'rent_amount',
    'deposit_amount',
    'bedrooms',
    'bathrooms',
    'area_sqft',
    'address_line',
    'locality',
    'city',
    'state',
    'zip_code',
    'latitude',
    'longitude',
    'amenities',
    'images',
    'status',
    'verification_status',
    'rejection_reason',
  ];

  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      if (field === 'amenities' || field === 'images') {
        setClauses.push(`${field} = $${paramIndex}`);
        values.push(JSON.stringify(Array.isArray(updateData[field]) ? updateData[field] : []));
      } else {
        setClauses.push(`${field} = $${paramIndex}`);
        values.push(updateData[field]);
      }
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return await findPropertyById(id);
  }

  values.push(id);
  const query = `
    UPDATE properties
    SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

/**
 * Update property images list (supports reordering, primary selection, deletion).
 */
const updatePropertyImages = async (id, images) => {
  const query = `
    UPDATE properties
    SET images = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
  `;
  const result = await pool.query(query, [
    JSON.stringify(Array.isArray(images) ? images : []),
    id,
  ]);
  return result.rows[0] || null;
};

/**
 * Submit property for verification by owner.
 */
const submitPropertyForVerification = async (id, ownerId) => {
  const query = `
    UPDATE properties
    SET status = 'pending_verification',
        verification_status = 'pending_verification',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND owner_id = $2
    RETURNING *
  `;
  const result = await pool.query(query, [id, ownerId]);
  return result.rows[0] || null;
};

/**
 * Admin: Verify or reject property.
 */
const verifyPropertyByAdmin = async (id, { action, rejectionReason = null }) => {
  const isApproved = action === 'APPROVE' || action === 'VERIFY';
  const newStatus = isApproved ? 'published' : 'rejected';
  const newVerifStatus = isApproved ? 'verified' : 'rejected';

  const query = `
    UPDATE properties
    SET status = $1,
        verification_status = $2,
        rejection_reason = $3,
        verified_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *
  `;

  const result = await pool.query(query, [
    newStatus,
    newVerifStatus,
    isApproved ? null : rejectionReason,
    id,
  ]);
  return result.rows[0] || null;
};

/**
 * Admin: List all properties with verification status filters and pagination.
 */
const getAllPropertiesForAdmin = async ({ verification_status, status, search, page = 1, limit = 20 }) => {
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (verification_status && verification_status !== 'all') {
    conditions.push(`p.verification_status = $${paramIdx++}`);
    params.push(verification_status);
  } else if (status && status !== 'all') {
    conditions.push(`p.status = $${paramIdx++}`);
    params.push(status);
  }

  if (search && search.trim()) {
    conditions.push(`(p.title ILIKE $${paramIdx} OR p.city ILIKE $${paramIdx} OR u.full_name ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx})`);
    params.push(`%${search.trim()}%`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM properties p
    JOIN users u ON p.owner_id = u.id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const total = countRes.rows[0]?.total || 0;

  const offset = (Number(page) - 1) * Number(limit);
  params.push(Number(limit), offset);

  const query = `
    SELECT 
      p.id,
      p.owner_id,
      p.title,
      p.property_type,
      p.furnishing,
      p.rent_amount,
      p.bedrooms,
      p.bathrooms,
      p.area_sqft,
      p.locality,
      p.city,
      p.state,
      p.images,
      p.status,
      p.verification_status,
      p.rejection_reason,
      p.verified_at,
      p.created_at,
      json_build_object(
        'id', u.id,
        'full_name', u.full_name,
        'email', u.email,
        'phone', u.phone
      ) AS owner
    FROM properties p
    JOIN users u ON p.owner_id = u.id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `;

  const result = await pool.query(query, params);

  return {
    properties: result.rows,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

/**
 * Admin: Get complete real database statistics for admin dashboard.
 */
const getAdminDashboardStats = async () => {
  const usersCountRes = await pool.query(`
    SELECT 
      COUNT(*)::int AS total_users,
      COUNT(*) FILTER (WHERE role = 'owner')::int AS total_owners,
      COUNT(*) FILTER (WHERE role = 'tenant')::int AS total_tenants,
      COUNT(*) FILTER (WHERE role = 'agent')::int AS total_agents,
      COUNT(*) FILTER (WHERE account_status = 'SUSPENDED')::int AS suspended_users
    FROM users
  `);

  const propertiesCountRes = await pool.query(`
    SELECT 
      COUNT(*)::int AS total_properties,
      COUNT(*) FILTER (WHERE status = 'published' OR verification_status = 'verified')::int AS verified_properties,
      COUNT(*) FILTER (WHERE status = 'pending_verification' OR verification_status = 'pending_verification')::int AS pending_verification,
      COUNT(*) FILTER (WHERE status = 'rejected' OR verification_status = 'rejected')::int AS rejected_properties,
      COUNT(*) FILTER (WHERE status = 'draft')::int AS draft_properties
    FROM properties
  `);

  const applicationsCountRes = await pool.query(`
    SELECT 
      COUNT(*)::int AS total_applications,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_applications,
      COUNT(*) FILTER (WHERE status = 'approved')::int AS approved_applications
    FROM rental_applications
  `);

  const visitsCountRes = await pool.query(`
    SELECT 
      COUNT(*)::int AS total_visits,
      COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending_visits,
      COUNT(*) FILTER (WHERE status = 'APPROVED')::int AS approved_visits
    FROM property_visits
  `);

  const documentsCountRes = await pool.query(`
    SELECT 
      COUNT(*)::int AS total_documents,
      COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending_documents,
      COUNT(*) FILTER (WHERE status = 'VERIFIED')::int AS verified_documents
    FROM documents
  `);

  return {
    users: usersCountRes.rows[0],
    properties: propertiesCountRes.rows[0],
    applications: applicationsCountRes.rows[0],
    visits: visitsCountRes.rows[0],
    documents: documentsCountRes.rows[0],
  };
};

/**
 * Delete a property by ID.
 */
const deleteProperty = async (id) => {
  const result = await pool.query('DELETE FROM properties WHERE id = $1', [id]);
  return result.rowCount > 0;
};

/**
 * Get owner statistics for properties
 */
const getOwnerPropertyStats = async (ownerId) => {
  const query = `
    SELECT 
      COUNT(*) AS total_properties,
      COUNT(*) FILTER (WHERE status = 'published') AS published_count,
      COUNT(*) FILTER (WHERE status = 'rented') AS rented_count,
      COUNT(*) FILTER (WHERE status = 'pending' OR status = 'pending_verification') AS pending_count,
      COUNT(*) FILTER (WHERE status = 'draft') AS draft_count,
      COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_count,
      COALESCE(SUM(rent_amount) FILTER (WHERE status = 'rented'), 0) AS monthly_revenue
    FROM properties
    WHERE owner_id = $1
  `;
  const result = await pool.query(query, [ownerId]);
  return result.rows[0];
};

module.exports = {
  VALID_TYPES,
  VALID_STATUSES,
  VALID_FURNISHING,
  getPublishedProperties,
  findPropertyById,
  getPropertiesByOwnerId,
  createProperty,
  updateProperty,
  updatePropertyImages,
  submitPropertyForVerification,
  verifyPropertyByAdmin,
  getAllPropertiesForAdmin,
  getAdminDashboardStats,
  deleteProperty,
  getOwnerPropertyStats,
};
