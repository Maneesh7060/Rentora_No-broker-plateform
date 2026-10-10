const {
  createApplication,
  checkPendingApplication,
  findApplicationById,
  findApplicationsByTenant,
  findApplicationsByOwner,
  updateApplicationStatus,
  countTenantApplications,
  countOwnerApplications,
} = require('../models/applicationModel');
const { findPropertyById } = require('../models/propertyModel');
const { createNotification } = require('../models/notificationModel');
const { countUserWishlist } = require('../models/wishlistModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Submit rental application
 * POST /api/v1/applications
 */
const applyForProperty = async (req, res, next) => {
  try {
    const tenantId = req.user.id;
    const {
      propertyId,
      applicantName,
      phone,
      email,
      monthlyIncome,
      employmentStatus,
      occupation,
      occupants,
      moveInDate,
      message,
    } = req.body;

    if (!propertyId) {
      return sendError(res, 400, 'Property ID is required.');
    }

    if (!applicantName || !phone || !email || !monthlyIncome || !moveInDate) {
      return sendError(
        res,
        400,
        'Please provide all required fields (Name, Phone, Email, Monthly Income, Move-in Date).'
      );
    }

    const numericIncome = parseFloat(monthlyIncome);
    if (isNaN(numericIncome) || numericIncome < 0) {
      return sendError(res, 400, 'Monthly income must be a positive number.');
    }

    // Verify property exists
    const property = await findPropertyById(propertyId);
    if (!property) {
      return sendError(res, 404, 'Property not found.');
    }

    // Tenant cannot apply to their own property
    if (property.owner_id === tenantId) {
      return sendError(res, 400, 'You cannot apply to rent your own property.');
    }

    // Check for existing pending application
    const existing = await checkPendingApplication(tenantId, propertyId);
    if (existing) {
      return sendError(
        res,
        409,
        'You already have an active pending application for this property. Please wait for the owner to review it.'
      );
    }

    const application = await createApplication({
      propertyId,
      tenantId,
      ownerId: property.owner_id,
      applicantName: applicantName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      monthlyIncome: numericIncome,
      employmentStatus: employmentStatus || 'employed',
      occupation: occupation ? occupation.trim() : null,
      occupants: parseInt(occupants, 10) || 1,
      moveInDate,
      message: message ? message.trim() : null,
    });

    // Send in-app notification to property owner
    try {
      await createNotification({
        userId: property.owner_id,
        title: 'New Rental Application Received',
        message: `${applicantName} submitted a rental application for "${property.title}".`,
        type: 'application_submitted',
        link: '/owner/applications',
      });
    } catch (notifErr) {
      console.error('Failed to create owner notification:', notifErr.message);
    }

    return sendSuccess(res, 201, 'Rental application submitted successfully!', application);
  } catch (err) {
    next(err);
  }
};

/**
 * Get tenant's submitted applications
 * GET /api/v1/applications/my-applications
 */
const getMyApplications = async (req, res, next) => {
  try {
    const tenantId = req.user.id;
    const { status, limit, offset } = req.query;

    const applications = await findApplicationsByTenant(tenantId, {
      status,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return sendSuccess(res, 200, 'Tenant applications retrieved successfully.', applications);
  } catch (err) {
    next(err);
  }
};

/**
 * Get owner's received applications
 * GET /api/v1/applications/received
 */
const getReceivedApplications = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { propertyId, status, limit, offset } = req.query;

    const applications = await findApplicationsByOwner(ownerId, {
      propertyId: propertyId ? parseInt(propertyId, 10) : undefined,
      status,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return sendSuccess(res, 200, 'Received applications retrieved successfully.', applications);
  } catch (err) {
    next(err);
  }
};

/**
 * Get single application by ID
 * GET /api/v1/applications/:id
 */
const getApplicationDetails = async (req, res, next) => {
  try {
    const applicationId = parseInt(req.params.id, 10);
    const application = await findApplicationById(applicationId);

    if (!application) {
      return sendError(res, 404, 'Rental application not found.');
    }

    // Auth check: Only applicant tenant, property owner, or admin can view
    const isApplicant = application.tenant_id === req.user.id;
    const isOwner = application.owner_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isApplicant && !isOwner && !isAdmin) {
      return sendError(res, 403, 'You do not have permission to view this application.');
    }

    return sendSuccess(res, 200, 'Application retrieved successfully.', application);
  } catch (err) {
    next(err);
  }
};

/**
 * Update application status (Owner or Admin: approve, reject)
 * PATCH /api/v1/applications/:id/status
 */
const updateStatus = async (req, res, next) => {
  try {
    const applicationId = parseInt(req.params.id, 10);
    const { status, ownerNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return sendError(res, 400, "Status must be either 'approved' or 'rejected'.");
    }

    const application = await findApplicationById(applicationId);
    if (!application) {
      return sendError(res, 404, 'Rental application not found.');
    }

    // Owner or admin only
    if (application.owner_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 403, 'You do not have permission to update this application.');
    }

    const updated = await updateApplicationStatus(applicationId, {
      status,
      ownerNotes: ownerNotes ? ownerNotes.trim() : undefined,
    });

    // Notify tenant of decision
    try {
      const isApproved = status === 'approved';
      await createNotification({
        userId: application.tenant_id,
        title: isApproved ? 'Application Approved! 🎉' : 'Application Status Update',
        message: isApproved
          ? `Congratulations! Your rental application for "${application.property_title}" was APPROVED by the owner.`
          : `Your rental application for "${application.property_title}" was not approved at this time.`,
        type: isApproved ? 'application_approved' : 'application_rejected',
        link: `/tenant/applications/${applicationId}`,
      });
    } catch (notifErr) {
      console.error('Failed to notify tenant:', notifErr.message);
    }

    return sendSuccess(
      res,
      200,
      `Application has been ${status} successfully.`,
      updated
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Withdraw application (Tenant only)
 * PATCH /api/v1/applications/:id/withdraw
 */
const withdrawApplication = async (req, res, next) => {
  try {
    const applicationId = parseInt(req.params.id, 10);
    const application = await findApplicationById(applicationId);

    if (!application) {
      return sendError(res, 404, 'Rental application not found.');
    }

    if (application.tenant_id !== req.user.id) {
      return sendError(res, 403, 'You can only withdraw your own applications.');
    }

    if (application.status !== 'pending') {
      return sendError(
        res,
        400,
        `Cannot withdraw application because it is already marked as ${application.status}.`
      );
    }

    const updated = await updateApplicationStatus(applicationId, {
      status: 'withdrawn',
    });

    // Notify owner
    try {
      await createNotification({
        userId: application.owner_id,
        title: 'Application Withdrawn',
        message: `${application.applicant_name} has withdrawn their application for "${application.property_title}".`,
        type: 'application_withdrawn',
        link: '/owner/applications',
      });
    } catch (notifErr) {
      console.error('Failed to notify owner of withdrawal:', notifErr.message);
    }

    return sendSuccess(res, 200, 'Application withdrawn successfully.', updated);
  } catch (err) {
    next(err);
  }
};

/**
 * Tenant stats overview
 * GET /api/v1/applications/tenant-stats
 */
const getTenantDashboardStats = async (req, res, next) => {
  try {
    const tenantId = req.user.id;
    const appStats = await countTenantApplications(tenantId);
    const wishlistCount = await countUserWishlist(tenantId);

    return sendSuccess(res, 200, 'Tenant stats retrieved.', {
      applications: appStats,
      wishlistCount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Owner stats overview
 * GET /api/v1/applications/owner-stats
 */
const getOwnerDashboardStats = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const appStats = await countOwnerApplications(ownerId);

    return sendSuccess(res, 200, 'Owner application stats retrieved.', appStats);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  applyForProperty,
  getMyApplications,
  getReceivedApplications,
  getApplicationDetails,
  updateStatus,
  withdrawApplication,
  getTenantDashboardStats,
  getOwnerDashboardStats,
};
