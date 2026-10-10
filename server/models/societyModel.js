const pool = require('../config/db');

/**
 * Validate geographic coordinates
 */
function isValidCoord(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return false;
  const nLat = Number(lat);
  const nLng = Number(lng);
  return (
    !isNaN(nLat) &&
    !isNaN(nLng) &&
    nLat >= -90 &&
    nLat <= 90 &&
    nLng >= -180 &&
    nLng <= 180 &&
    (nLat !== 0 || nLng !== 0)
  );
}

/**
 * Find housing societies near a given latitude/longitude within a radius in km.
 * Also returns exact count of societies available within 5km, 10km, and 15km.
 * 
 * @param {Object} params
 * @param {number} params.latitude
 * @param {number} params.longitude
 * @param {number} [params.radius=10]
 * @param {number} [params.limit=50]
 * @returns {Promise<{ societies: Array, total: number, counts_by_radius: Object }>}
 */
const findNearbySocieties = async ({ latitude, longitude, radius = 10, limit = 50 }) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const rad = Math.max(1, parseFloat(radius) || 10);

  if (!isValidCoord(lat, lng)) {
    throw new Error('Valid latitude and longitude coordinates are required for nearby search.');
  }

  // Haversine distance in kilometers query
  const query = `
    WITH distance_calc AS (
      SELECT 
        s.id,
        s.name,
        s.locality,
        s.city,
        s.state,
        s.latitude,
        s.longitude,
        s.description,
        s.created_at,
        ROUND(
          (6371 * acos(
            least(1.0, greatest(-1.0, 
              cos(radians($1)) * cos(radians(s.latitude)) * cos(radians(s.longitude) - radians($2)) + 
              sin(radians($1)) * sin(radians(s.latitude))
            ))
          ))::numeric, 1
        )::double precision AS distance_km,
        COUNT(p.id) FILTER (WHERE p.status = 'published')::int AS property_count
      FROM societies s
      LEFT JOIN properties p ON p.society_id = s.id
      GROUP BY s.id
    )
    SELECT * FROM distance_calc
    WHERE distance_km <= $3
    ORDER BY distance_km ASC, name ASC
    LIMIT $4;
  `;

  // Summary counts query for 5km, 10km, 15km radii
  const summaryQuery = `
    SELECT 
      COUNT(*) FILTER (WHERE distance_km <= 5)::int AS count_5km,
      COUNT(*) FILTER (WHERE distance_km <= 10)::int AS count_10km,
      COUNT(*) FILTER (WHERE distance_km <= 15)::int AS count_15km
    FROM (
      SELECT 
        (6371 * acos(
          least(1.0, greatest(-1.0, 
            cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + 
            sin(radians($1)) * sin(radians(latitude))
          ))
        )) AS distance_km
      FROM societies
    ) sub;
  `;

  const [resSocieties, resSummary] = await Promise.all([
    pool.query(query, [lat, lng, rad, limit]),
    pool.query(summaryQuery, [lat, lng]),
  ]);

  const summary = resSummary.rows[0] || { count_5km: 0, count_10km: 0, count_15km: 0 };

  return {
    societies: resSocieties.rows,
    total: resSocieties.rows.length,
    counts_by_radius: {
      '5km': summary.count_5km || 0,
      '10km': summary.count_10km || 0,
      '15km': summary.count_15km || 0,
    },
  };
};

/**
 * Find single society by ID with property count and published properties list
 */
const findSocietyById = async (id) => {
  const societyQuery = `
    SELECT 
      s.*,
      COUNT(p.id) FILTER (WHERE p.status = 'published')::int AS property_count
    FROM societies s
    LEFT JOIN properties p ON p.society_id = s.id
    WHERE s.id = $1
    GROUP BY s.id;
  `;
  const { rows } = await pool.query(societyQuery, [id]);
  if (!rows[0]) return null;

  const society = rows[0];

  // Also fetch list of properties inside this society
  const propertiesQuery = `
    SELECT 
      id, title, property_type, furnishing, rent_amount, deposit_amount,
      bedrooms, bathrooms, area_sqft, address_line, locality, city, state,
      images, status
    FROM properties
    WHERE society_id = $1 AND status = 'published'
    ORDER BY rent_amount ASC;
  `;
  const propsRes = await pool.query(propertiesQuery, [id]);
  society.properties = propsRes.rows;

  return society;
};

/**
 * General list of societies with search and city filter
 */
const listSocieties = async ({ search, city, limit = 50, offset = 0 } = {}) => {
  let query = `
    SELECT 
      s.*,
      COUNT(p.id) FILTER (WHERE p.status = 'published')::int AS property_count
    FROM societies s
    LEFT JOIN properties p ON p.society_id = s.id
    WHERE 1=1
  `;
  const values = [];

  if (search && search.trim()) {
    values.push(`%${search.trim()}%`);
    query += ` AND (s.name ILIKE $${values.length} OR s.locality ILIKE $${values.length} OR s.city ILIKE $${values.length})`;
  }

  if (city && city.trim()) {
    values.push(city.trim());
    query += ` AND s.city ILIKE $${values.length}`;
  }

  query += ` GROUP BY s.id ORDER BY s.name ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);

  const { rows } = await pool.query(query, values);
  return rows;
};

module.exports = {
  findNearbySocieties,
  findSocietyById,
  listSocieties,
};
