const pool = require('../config/db');

const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'];
const DEFAULT_SLOT_DURATION_MINUTES = 30;

/**
 * Format 24-hour time string (e.g. "14:30:00") into 12-hour display label (e.g. "2:30 PM")
 */
function formatTimeLabel(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = String(minutes).padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Add minutes to time string (HH:MM:SS)
 */
function addMinutesToTime(timeStr, minutesToAdd) {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutesToAdd;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:00`;
}

/**
 * Compare two time strings "HH:MM:SS"
 */
function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Generate 30-minute interval slots between startTime and endTime
 */
function generateTimeSlots(startTime, endTime, durationMinutes = DEFAULT_SLOT_DURATION_MINUTES) {
  const slots = [];
  let current = startTime.length === 5 ? `${startTime}:00` : startTime;
  const end = endTime.length === 5 ? `${endTime}:00` : endTime;

  const endMinutes = timeToMinutes(end);

  while (timeToMinutes(current) + durationMinutes <= endMinutes) {
    const slotEnd = addMinutesToTime(current, durationMinutes);
    slots.push({
      start_time: current,
      end_time: slotEnd,
      label: `${formatTimeLabel(current)} - ${formatTimeLabel(slotEnd)}`,
      start_label: formatTimeLabel(current),
      end_label: formatTimeLabel(slotEnd),
    });
    current = slotEnd;
  }

  return slots;
}

/**
 * Get configured availability for an owner
 */
const getOwnerAvailability = async (ownerId, propertyId = null) => {
  let query = `
    SELECT * FROM visit_availability
    WHERE owner_id = $1
  `;
  const values = [ownerId];

  if (propertyId) {
    query += ` AND (property_id = $2 OR property_id IS NULL) ORDER BY property_id DESC NULLS LAST, day_of_week ASC`;
    values.push(propertyId);
  } else {
    query += ` AND property_id IS NULL ORDER BY day_of_week ASC`;
  }

  const { rows } = await pool.query(query, values);

  // If no custom availability configured, return default template
  if (rows.length === 0) {
    return [
      { day_of_week: 1, day_name: 'Monday', start_time: '10:00:00', end_time: '18:00:00', is_active: true },
      { day_of_week: 2, day_name: 'Tuesday', start_time: '10:00:00', end_time: '18:00:00', is_active: true },
      { day_of_week: 3, day_name: 'Wednesday', start_time: '10:00:00', end_time: '18:00:00', is_active: true },
      { day_of_week: 4, day_name: 'Thursday', start_time: '10:00:00', end_time: '18:00:00', is_active: true },
      { day_of_week: 5, day_name: 'Friday', start_time: '10:00:00', end_time: '18:00:00', is_active: true },
      { day_of_week: 6, day_name: 'Saturday', start_time: '10:00:00', end_time: '14:00:00', is_active: true },
      { day_of_week: 0, day_name: 'Sunday', start_time: '10:00:00', end_time: '14:00:00', is_active: false },
    ];
  }

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return rows.map((r) => ({
    ...r,
    day_name: DAY_NAMES[r.day_of_week],
  }));
};

/**
 * Set/update owner's weekly availability schedule
 */
const setOwnerAvailability = async (ownerId, daysSchedule, propertyId = null) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of daysSchedule) {
      const dayOfWeek = parseInt(item.day_of_week, 10);
      const startTime = item.start_time;
      const endTime = item.end_time;
      const isActive = item.is_active !== undefined ? Boolean(item.is_active) : true;

      const upsertQuery = `
        INSERT INTO visit_availability (owner_id, property_id, day_of_week, start_time, end_time, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (owner_id, property_id, day_of_week)
        DO UPDATE SET
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          is_active = EXCLUDED.is_active,
          updated_at = CURRENT_TIMESTAMP;
      `;

      await client.query(upsertQuery, [ownerId, propertyId, dayOfWeek, startTime, endTime, isActive]);
    }

    await client.query('COMMIT');
    return await getOwnerAvailability(ownerId, propertyId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Get available bookable visit slots for a property on a specific date
 */
const getAvailableSlotsForDate = async (propertyId, dateStr) => {
  // Validate property exists and get owner info
  const propQuery = `
    SELECT p.id, p.title, p.owner_id, p.status, p.locality, p.city, p.rent_amount,
           u.full_name AS owner_name, u.email AS owner_email, u.phone AS owner_phone
    FROM properties p
    JOIN users u ON p.owner_id = u.id
    WHERE p.id = $1
  `;
  const propRes = await pool.query(propQuery, [propertyId]);
  if (!propRes.rows[0]) {
    const error = new Error('Property not found.');
    error.statusCode = 404;
    throw error;
  }

  const property = propRes.rows[0];

  // Parse target date and day of week
  const targetDate = new Date(`${dateStr}T00:00:00`);
  if (isNaN(targetDate.getTime())) {
    const error = new Error('Invalid date format. Expected YYYY-MM-DD.');
    error.statusCode = 400;
    throw error;
  }

  // Check if date is in the past (comparing YYYY-MM-DD strings)
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  if (dateStr < todayStr) {
    return {
      property,
      date: dateStr,
      is_available_day: false,
      reason: 'Visits cannot be scheduled for past dates.',
      slots: [],
    };
  }

  const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday

  // Fetch owner's active availability for this day
  const availQuery = `
    SELECT * FROM visit_availability
    WHERE owner_id = $1 AND (property_id = $2 OR property_id IS NULL) AND day_of_week = $3
    ORDER BY property_id DESC NULLS LAST
    LIMIT 1;
  `;
  const availRes = await pool.query(availQuery, [property.owner_id, propertyId, dayOfWeek]);

  let availability = availRes.rows[0];
  if (!availability) {
    // Default fallback: Mon-Sat 10:00 to 18:00
    if (dayOfWeek >= 1 && dayOfWeek <= 6) {
      availability = {
        day_of_week: dayOfWeek,
        start_time: '10:00:00',
        end_time: dayOfWeek === 6 ? '14:00:00' : '18:00:00',
        is_active: true,
      };
    } else {
      availability = { day_of_week: 0, is_active: false };
    }
  }

  if (!availability.is_active) {
    return {
      property,
      date: dateStr,
      day_of_week: dayOfWeek,
      is_available_day: false,
      reason: 'The owner is not available for visits on this day of the week.',
      slots: [],
    };
  }

  // Generate 30-min time slots
  const allSlots = generateTimeSlots(availability.start_time, availability.end_time);

  // Fetch existing booked/pending visits for this property and date
  const bookedVisitsQuery = `
    SELECT start_time, end_time, status
    FROM property_visits
    WHERE property_id = $1 AND visit_date = $2 AND status IN ('PENDING', 'APPROVED');
  `;
  const bookedRes = await pool.query(bookedVisitsQuery, [propertyId, dateStr]);
  const bookedTimes = new Set(bookedRes.rows.map((r) => r.start_time.substring(0, 5)));

  // If date is today, determine which slots have already passed
  const currentMinutesToday = now.getHours() * 60 + now.getMinutes();
  const isToday = dateStr === todayStr;

  const slots = allSlots.map((slot) => {
    const slotMinutes = timeToMinutes(slot.start_time);
    const hasPassed = isToday && slotMinutes <= currentMinutesToday;
    const isBooked = bookedTimes.has(slot.start_time.substring(0, 5));

    return {
      ...slot,
      is_available: !hasPassed && !isBooked,
      is_booked: isBooked,
      has_passed: hasPassed,
    };
  });

  return {
    property: {
      id: property.id,
      title: property.title,
      locality: property.locality,
      city: property.city,
      rent_amount: property.rent_amount,
      owner_name: property.owner_name,
    },
    date: dateStr,
    day_of_week: dayOfWeek,
    is_available_day: true,
    available_slot_count: slots.filter((s) => s.is_available).length,
    slots,
  };
};

/**
 * Create a new property visit request with transaction locking to prevent race conditions
 */
const createVisitRequest = async ({
  propertyId,
  tenantId,
  visitDate,
  startTime,
  endTime,
  tenantMessage = '',
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check property exists and get owner
    const propRes = await client.query(
      `SELECT id, title, owner_id, status FROM properties WHERE id = $1 FOR SHARE`,
      [propertyId]
    );

    if (!propRes.rows[0]) {
      const err = new Error('Property not found.');
      err.statusCode = 404;
      throw err;
    }

    const property = propRes.rows[0];

    // 2. Validate tenant cannot request visit for own property
    if (property.owner_id === tenantId) {
      const err = new Error('You cannot schedule a visit for your own property.');
      err.statusCode = 400;
      throw err;
    }

    // 3. Validate date is not in past
    const todayStr = new Date().toISOString().split('T')[0];
    if (visitDate < todayStr) {
      const err = new Error('Visits cannot be scheduled for past dates.');
      err.statusCode = 400;
      throw err;
    }

    const formattedStart = startTime.length === 5 ? `${startTime}:00` : startTime;
    const formattedEnd = endTime
      ? endTime.length === 5
        ? `${endTime}:00`
        : endTime
      : addMinutesToTime(formattedStart, DEFAULT_SLOT_DURATION_MINUTES);

    // 4. Double-Booking Prevention: Lock any active visits on same slot
    const conflictRes = await client.query(
      `SELECT id, status FROM property_visits
       WHERE property_id = $1 AND visit_date = $2 AND start_time = $3 AND status IN ('PENDING', 'APPROVED')
       FOR UPDATE`,
      [propertyId, visitDate, formattedStart]
    );

    if (conflictRes.rows.length > 0) {
      const err = new Error('The selected time slot has already been booked or requested. Please choose another time.');
      err.statusCode = 409;
      throw err;
    }

    // 5. Check if tenant already has an active visit for this property on this date & time
    const tenantExistingRes = await client.query(
      `SELECT id FROM property_visits
       WHERE property_id = $1 AND tenant_id = $2 AND visit_date = $3 AND start_time = $4 AND status IN ('PENDING', 'APPROVED')`,
      [propertyId, tenantId, visitDate, formattedStart]
    );

    if (tenantExistingRes.rows.length > 0) {
      const err = new Error('You already have an active visit request for this property at the selected time.');
      err.statusCode = 409;
      throw err;
    }

    // 6. Insert new visit request
    const insertQuery = `
      INSERT INTO property_visits (
        property_id, tenant_id, owner_id, visit_date, start_time, end_time, status, tenant_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7)
      RETURNING *;
    `;

    const insertRes = await client.query(insertQuery, [
      propertyId,
      tenantId,
      property.owner_id,
      visitDate,
      formattedStart,
      formattedEnd,
      tenantMessage,
    ]);

    await client.query('COMMIT');
    return insertRes.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Find visit by ID with complete property, tenant, and owner details
 */
const findVisitById = async (id) => {
  const query = `
    SELECT 
      v.*,
      p.title AS property_title,
      p.address_line AS property_address,
      p.locality AS property_locality,
      p.city AS property_city,
      p.state AS property_state,
      p.rent_amount AS property_rent,
      p.property_type,
      p.furnishing,
      p.bedrooms,
      p.bathrooms,
      p.images AS property_images,
      p.latitude AS property_latitude,
      p.longitude AS property_longitude,
      t.full_name AS tenant_name,
      t.email AS tenant_email,
      t.phone AS tenant_phone,
      t.avatar_url AS tenant_avatar,
      o.full_name AS owner_name,
      o.email AS owner_email,
      o.phone AS owner_phone,
      o.avatar_url AS owner_avatar
    FROM property_visits v
    JOIN properties p ON v.property_id = p.id
    JOIN users t ON v.tenant_id = t.id
    JOIN users o ON v.owner_id = o.id
    WHERE v.id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

/**
 * List visits for a tenant
 */
const findVisitsByTenant = async (tenantId, { status, limit = 20, offset = 0 } = {}) => {
  let query = `
    SELECT 
      v.*,
      p.title AS property_title,
      p.locality AS property_locality,
      p.city AS property_city,
      p.rent_amount AS property_rent,
      p.images AS property_images,
      p.bedrooms,
      p.bathrooms,
      o.full_name AS owner_name,
      o.email AS owner_email,
      o.phone AS owner_phone
    FROM property_visits v
    JOIN properties p ON v.property_id = p.id
    JOIN users o ON v.owner_id = o.id
    WHERE v.tenant_id = $1
  `;
  const values = [tenantId];

  if (status && status !== 'all') {
    query += ` AND v.status = $${values.length + 1}`;
    values.push(status.toUpperCase());
  }

  query += ` ORDER BY v.visit_date DESC, v.start_time DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);

  const { rows } = await pool.query(query, values);
  return rows;
};

/**
 * List received visit requests for an owner
 */
const findVisitsByOwner = async (ownerId, { status, limit = 20, offset = 0 } = {}) => {
  let query = `
    SELECT 
      v.*,
      p.title AS property_title,
      p.locality AS property_locality,
      p.city AS property_city,
      p.rent_amount AS property_rent,
      p.images AS property_images,
      t.full_name AS tenant_name,
      t.email AS tenant_email,
      t.phone AS tenant_phone,
      t.avatar_url AS tenant_avatar
    FROM property_visits v
    JOIN properties p ON v.property_id = p.id
    JOIN users t ON v.tenant_id = t.id
    WHERE v.owner_id = $1
  `;
  const values = [ownerId];

  if (status && status !== 'all') {
    query += ` AND v.status = $${values.length + 1}`;
    values.push(status.toUpperCase());
  }

  query += ` ORDER BY v.visit_date ASC, v.start_time ASC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
  values.push(limit, offset);

  const { rows } = await pool.query(query, values);
  return rows;
};

/**
 * Update visit status by owner (Approve or Reject)
 */
const updateVisitStatus = async (visitId, newStatus, ownerNotes = null, ownerId = null) => {
  const upperStatus = newStatus.toUpperCase();
  if (!['APPROVED', 'REJECTED'].includes(upperStatus)) {
    const err = new Error('Invalid status. Only APPROVED or REJECTED are permitted for owner reviews.');
    err.statusCode = 400;
    throw err;
  }

  let query = `
    UPDATE property_visits
    SET status = $1, owner_notes = COALESCE($2, owner_notes), updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
  `;
  const values = [upperStatus, ownerNotes, visitId];

  if (ownerId) {
    query += ` AND owner_id = $4`;
    values.push(ownerId);
  }

  query += ` RETURNING *;`;

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
};

/**
 * Cancel a pending visit request by the tenant
 */
const cancelVisitByTenant = async (visitId, tenantId) => {
  const query = `
    UPDATE property_visits
    SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND tenant_id = $2 AND status = 'PENDING'
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [visitId, tenantId]);
  return rows[0] || null;
};

/**
 * Get tenant visit summary statistics
 */
const getTenantVisitStats = async (tenantId) => {
  const query = `
    SELECT 
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'APPROVED')::int AS approved,
      COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
      COUNT(*) FILTER (WHERE status = 'REJECTED')::int AS rejected,
      COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled,
      COUNT(*) FILTER (WHERE status = 'APPROVED' AND visit_date >= CURRENT_DATE)::int AS upcoming
    FROM property_visits
    WHERE tenant_id = $1;
  `;
  const { rows } = await pool.query(query, [tenantId]);
  return rows[0] || { total: 0, pending: 0, approved: 0, completed: 0, rejected: 0, cancelled: 0, upcoming: 0 };
};

/**
 * Get owner visit summary statistics
 */
const getOwnerVisitStats = async (ownerId) => {
  const query = `
    SELECT 
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'APPROVED')::int AS approved,
      COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
      COUNT(*) FILTER (WHERE status = 'REJECTED')::int AS rejected,
      COUNT(*) FILTER (WHERE status = 'APPROVED' AND visit_date >= CURRENT_DATE)::int AS upcoming
    FROM property_visits
    WHERE owner_id = $1;
  `;
  const { rows } = await pool.query(query, [ownerId]);
  return rows[0] || { total: 0, pending: 0, approved: 0, completed: 0, rejected: 0, upcoming: 0 };
};

/**
 * Server-side auto-completion for past visits:
 * Transitions APPROVED visits to COMPLETED once the visit datetime has passed.
 */
const autoCompletePastVisits = async () => {
  const query = `
    UPDATE property_visits
    SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
    WHERE status = 'APPROVED'
      AND (
        visit_date < CURRENT_DATE
        OR (visit_date = CURRENT_DATE AND end_time < CURRENT_TIME)
      )
    RETURNING id;
  `;
  const { rows } = await pool.query(query);
  return rows.length;
};

module.exports = {
  VALID_STATUSES,
  DEFAULT_SLOT_DURATION_MINUTES,
  formatTimeLabel,
  generateTimeSlots,
  getOwnerAvailability,
  setOwnerAvailability,
  getAvailableSlotsForDate,
  createVisitRequest,
  findVisitById,
  findVisitsByTenant,
  findVisitsByOwner,
  updateVisitStatus,
  cancelVisitByTenant,
  getTenantVisitStats,
  getOwnerVisitStats,
  autoCompletePastVisits,
};
