const {
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
  formatTimeLabel,
} = require('../models/visitModel');
const { findPropertyById } = require('../models/propertyModel');
const { createNotification } = require('../models/notificationModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Format date for friendly notification strings (e.g. "30 Sep 2026")
 */
function formatDateFriendly(dateStr) {
  if (!dateStr) return '';
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return dateStr;
  return dateObj.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * POST /api/v1/visits
 * Request an in-person property visit (Tenant)
 */
const requestVisit = async (req, res, next) => {
  try {
    const tenantId = req.user.id;
    const {
      propertyId,
      visitDate,
      startTime,
      endTime,
      tenantMessage,
    } = req.body;

    if (!propertyId) {
      return sendError(res, 400, 'Property ID is required.');
    }

    if (!visitDate || !startTime) {
      return sendError(res, 400, 'Visit date and start time are required.');
    }

    // Validate property exists
    const property = await findPropertyById(propertyId);
    if (!property) {
      return sendError(res, 404, 'Property not found.');
    }

    if (property.status !== 'published') {
      return sendError(res, 400, 'Visits can only be scheduled for published listings.');
    }

    // Call model to create visit with double-booking prevention transaction
    const visit = await createVisitRequest({
      propertyId: parseInt(propertyId, 10),
      tenantId,
      visitDate,
      startTime,
      endTime,
      tenantMessage,
    });

    // Notify property owner of new visit request
    try {
      const friendlyDate = formatDateFriendly(visitDate);
      const friendlyTime = formatTimeLabel(startTime);
      await createNotification({
        userId: property.owner_id,
        title: 'New Visit Request',
        message: `${req.user.full_name} requested an in-person visit for "${property.title}" on ${friendlyDate} at ${friendlyTime}.`,
        type: 'visit',
        link: '/owner/visits',
      });
    } catch (notifErr) {
      console.error('Failed to create visit notification for owner:', notifErr);
    }

    return sendSuccess(res, 201, 'Visit request submitted successfully. Waiting for owner approval.', {
      visit,
    });
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.statusCode, err.message);
    }
    next(err);
  }
};

/**
 * GET /api/v1/visits/availability
 * Get available time slots for a property on a specific date (Public / Tenant)
 */
const getAvailableSlots = async (req, res, next) => {
  try {
    const { property_id, propertyId, date } = req.query;
    const pId = parseInt(property_id || propertyId, 10);

    if (isNaN(pId)) {
      return sendError(res, 400, 'Valid property ID is required.');
    }

    if (!date) {
      return sendError(res, 400, 'Date parameter (YYYY-MM-DD) is required.');
    }

    // Ensure past visits are marked completed
    await autoCompletePastVisits();

    const data = await getAvailableSlotsForDate(pId, date);
    return sendSuccess(res, 200, 'Available slots retrieved.', data);
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.statusCode, err.message);
    }
    next(err);
  }
};

/**
 * GET /api/v1/visits/my-visits
 * Get all visits requested by the authenticated tenant
 */
const getMyVisits = async (req, res, next) => {
  try {
    const tenantId = req.user.id;
    const { status, limit = 50, page = 1 } = req.query;
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, parseInt(limit, 10) || 50);
    const offset = (parsedPage - 1) * parsedLimit;

    await autoCompletePastVisits();

    const visits = await findVisitsByTenant(tenantId, { status, limit: parsedLimit, offset });
    const stats = await getTenantVisitStats(tenantId);

    return sendSuccess(res, 200, 'Tenant visits retrieved successfully.', {
      visits,
      stats,
      page: parsedPage,
      limit: parsedLimit,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/visits/received
 * Get all visit requests received by the authenticated owner
 */
const getReceivedVisits = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { status, limit = 50, page = 1 } = req.query;
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.max(1, parseInt(limit, 10) || 50);
    const offset = (parsedPage - 1) * parsedLimit;

    await autoCompletePastVisits();

    const visits = await findVisitsByOwner(ownerId, { status, limit: parsedLimit, offset });
    const stats = await getOwnerVisitStats(ownerId);

    return sendSuccess(res, 200, 'Owner visits retrieved successfully.', {
      visits,
      stats,
      page: parsedPage,
      limit: parsedLimit,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/visits/:id
 * Get single visit details
 */
const getVisitDetails = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return sendError(res, 400, 'Invalid visit ID.');
    }

    await autoCompletePastVisits();

    const visit = await findVisitById(id);
    if (!visit) {
      return sendError(res, 404, 'Visit request not found.');
    }

    // Access control: Only the requesting tenant, property owner, or admin can view
    const user = req.user;
    const isTenant = user.id === visit.tenant_id;
    const isOwner = user.id === visit.owner_id;
    const isAdmin = user.role === 'admin';

    if (!isTenant && !isOwner && !isAdmin) {
      return sendError(res, 403, 'You do not have permission to view this visit request.');
    }

    return sendSuccess(res, 200, 'Visit details retrieved.', { visit });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/visits/:id/status
 * Approve or Reject visit request (Owner / Admin)
 */
const updateStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const ownerId = req.user.id;
    const { status, ownerNotes } = req.body;

    if (isNaN(id)) {
      return sendError(res, 400, 'Invalid visit ID.');
    }

    if (!status) {
      return sendError(res, 400, 'Status is required (APPROVED or REJECTED).');
    }

    const visit = await findVisitById(id);
    if (!visit) {
      return sendError(res, 404, 'Visit request not found.');
    }

    // Verify ownership
    if (req.user.role !== 'admin' && visit.owner_id !== ownerId) {
      return sendError(res, 403, 'You can only manage visit requests for your own properties.');
    }

    if (visit.status !== 'PENDING') {
      return sendError(
        res,
        400,
        `Cannot change status of a visit that is already ${visit.status}.`
      );
    }

    const updatedVisit = await updateVisitStatus(
      id,
      status,
      ownerNotes,
      req.user.role === 'admin' ? null : ownerId
    );

    // Notify tenant of decision
    try {
      const friendlyDate = formatDateFriendly(visit.visit_date);
      const friendlyTime = formatTimeLabel(visit.start_time);
      const upperStatus = status.toUpperCase();

      if (upperStatus === 'APPROVED') {
        await createNotification({
          userId: visit.tenant_id,
          title: 'Visit Confirmed! 🎉',
          message: `Your property visit for "${visit.property_title}" on ${friendlyDate} at ${friendlyTime} has been approved by the owner.`,
          type: 'visit',
          link: `/tenant/visits/${visit.id}`,
        });
      } else if (upperStatus === 'REJECTED') {
        await createNotification({
          userId: visit.tenant_id,
          title: 'Visit Request Declined',
          message: `Your visit request for "${visit.property_title}" on ${friendlyDate} was declined by the owner.${ownerNotes ? ' Reason: ' + ownerNotes : ''}`,
          type: 'visit',
          link: `/tenant/visits/${visit.id}`,
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify tenant of visit status update:', notifErr);
    }

    return sendSuccess(res, 200, `Visit request ${status.toLowerCase()} successfully.`, {
      visit: updatedVisit,
    });
  } catch (err) {
    if (err.statusCode) {
      return sendError(res, err.statusCode, err.message);
    }
    next(err);
  }
};

/**
 * PATCH /api/v1/visits/:id/cancel
 * Cancel a pending visit request (Tenant)
 */
const cancelVisit = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const tenantId = req.user.id;

    if (isNaN(id)) {
      return sendError(res, 400, 'Invalid visit ID.');
    }

    const visit = await findVisitById(id);
    if (!visit) {
      return sendError(res, 404, 'Visit request not found.');
    }

    if (visit.tenant_id !== tenantId && req.user.role !== 'admin') {
      return sendError(res, 403, 'You can only cancel your own visit requests.');
    }

    if (visit.status !== 'PENDING') {
      return sendError(
        res,
        400,
        `Only pending visit requests can be cancelled. Current status is ${visit.status}.`
      );
    }

    const cancelled = await cancelVisitByTenant(id, tenantId);

    // Notify owner of cancellation
    try {
      const friendlyDate = formatDateFriendly(visit.visit_date);
      await createNotification({
        userId: visit.owner_id,
        title: 'Visit Request Cancelled',
        message: `${req.user.full_name} cancelled their scheduled visit for "${visit.property_title}" on ${friendlyDate}.`,
        type: 'visit',
        link: '/owner/visits',
      });
    } catch (notifErr) {
      console.error('Failed to notify owner of visit cancellation:', notifErr);
    }

    return sendSuccess(res, 200, 'Visit request cancelled successfully.', {
      visit: cancelled,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/visits/availability/owner
 * Get owner's weekly availability schedule
 */
const getOwnerAvailabilitySchedule = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { property_id } = req.query;
    const pId = property_id ? parseInt(property_id, 10) : null;

    const schedule = await getOwnerAvailability(ownerId, pId);
    return sendSuccess(res, 200, 'Owner availability schedule retrieved.', { schedule });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/visits/availability/owner
 * Update owner's weekly availability schedule
 */
const updateOwnerAvailabilitySchedule = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { schedule, property_id } = req.body;
    const pId = property_id ? parseInt(property_id, 10) : null;

    if (!schedule || !Array.isArray(schedule)) {
      return sendError(res, 400, 'Schedule array is required.');
    }

    const updated = await setOwnerAvailability(ownerId, schedule, pId);
    return sendSuccess(res, 200, 'Availability schedule updated successfully.', {
      schedule: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/visits/tenant-stats
 * Quick visit statistics for tenant dashboard
 */
const getTenantStats = async (req, res, next) => {
  try {
    const tenantId = req.user.id;
    const stats = await getTenantVisitStats(tenantId);
    return sendSuccess(res, 200, 'Tenant visit stats retrieved.', { stats });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/visits/owner-stats
 * Quick visit statistics for owner dashboard
 */
const getOwnerStats = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const stats = await getOwnerVisitStats(ownerId);
    return sendSuccess(res, 200, 'Owner visit stats retrieved.', { stats });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requestVisit,
  getAvailableSlots,
  getMyVisits,
  getReceivedVisits,
  getVisitDetails,
  updateStatus,
  cancelVisit,
  getOwnerAvailabilitySchedule,
  updateOwnerAvailabilitySchedule,
  getTenantStats,
  getOwnerStats,
};
