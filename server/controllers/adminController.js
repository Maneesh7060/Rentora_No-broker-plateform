const {
  getAdminDashboardStats,
  getAllPropertiesForAdmin,
  findPropertyById,
  verifyPropertyByAdmin,
} = require('../models/propertyModel');
const {
  getAllUsersForAdmin,
  updateUserAccountStatus,
  countAdminUsers,
  findUserById,
} = require('../models/userModel');
const {
  getAllDocumentsForAdmin,
  findDocumentById,
  updateDocumentStatus,
} = require('../models/documentModel');
const { createNotification } = require('../models/notificationModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * GET /api/v1/admin/stats
 * Real PostgreSQL platform analytics.
 */
const getStats = async (req, res) => {
  try {
    const stats = await getAdminDashboardStats();
    return sendSuccess(res, 200, 'Admin platform statistics retrieved.', { stats });
  } catch (err) {
    console.error('getStats error:', err);
    return sendError(res, 500, 'Failed to fetch admin stats.', err.message);
  }
};

/**
 * GET /api/v1/admin/properties
 * Admin property list with status filter and pagination.
 */
const getProperties = async (req, res) => {
  try {
    const data = await getAllPropertiesForAdmin(req.query);
    return sendSuccess(res, 200, 'Properties fetched for admin review.', data);
  } catch (err) {
    console.error('getProperties error:', err);
    return sendError(res, 500, 'Failed to fetch properties.', err.message);
  }
};

/**
 * GET /api/v1/admin/properties/:id
 * Admin single property review details.
 */
const getPropertyDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const property = await findPropertyById(id);
    if (!property) {
      return sendError(res, 404, 'Property not found.');
    }
    return sendSuccess(res, 200, 'Property details retrieved.', { property });
  } catch (err) {
    console.error('getPropertyDetails error:', err);
    return sendError(res, 500, 'Failed to fetch property details.', err.message);
  }
};

/**
 * PATCH /api/v1/admin/properties/:id/verify
 * Approve or Reject property listing.
 */
const verifyProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, rejectionReason } = req.body;

    if (!action || !['APPROVE', 'VERIFY', 'REJECT'].includes(action.toUpperCase())) {
      return sendError(res, 400, 'Valid action (APPROVE or REJECT) is required.');
    }

    const existing = await findPropertyById(id);
    if (!existing) {
      return sendError(res, 404, 'Property not found.');
    }

    const isApprove = action.toUpperCase() === 'APPROVE' || action.toUpperCase() === 'VERIFY';
    if (!isApprove && (!rejectionReason || rejectionReason.trim().length < 5)) {
      return sendError(res, 400, 'A clear rejection reason of at least 5 characters is required.');
    }

    const updated = await verifyPropertyByAdmin(id, {
      action: action.toUpperCase(),
      rejectionReason: isApprove ? null : rejectionReason.trim(),
    });

    // Notify owner
    try {
      if (isApprove) {
        await createNotification({
          userId: existing.owner_id,
          title: 'Property Listing Approved! 🎉',
          message: `Your listing "${existing.title}" has been verified by the Rentora moderation team and is now live to the public.`,
          type: 'property',
          link: `/properties/${existing.id}`,
        });
      } else {
        await createNotification({
          userId: existing.owner_id,
          title: 'Property Verification Declined ⚠️',
          message: `Your listing "${existing.title}" was rejected. Reason: ${rejectionReason.trim()}`,
          type: 'property',
          link: '/owner/properties',
        });
      }
    } catch (notifErr) {
      console.error('Admin notification error:', notifErr);
    }

    return sendSuccess(
      res,
      200,
      `Property has been ${isApprove ? 'approved and published' : 'rejected'}.`,
      { property: updated }
    );
  } catch (err) {
    console.error('verifyProperty error:', err);
    return sendError(res, 500, 'Failed to verify property.', err.message);
  }
};

/**
 * GET /api/v1/admin/users
 * Admin users list with role & status filters and pagination.
 */
const getUsers = async (req, res) => {
  try {
    const data = await getAllUsersForAdmin(req.query);
    return sendSuccess(res, 200, 'Users fetched for admin management.', data);
  } catch (err) {
    console.error('getUsers error:', err);
    return sendError(res, 500, 'Failed to fetch users.', err.message);
  }
};

/**
 * PATCH /api/v1/admin/users/:id/status
 * Activate or Suspend a user account.
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'SUSPENDED'].includes(status.toUpperCase())) {
      return sendError(res, 400, 'Status must be ACTIVE or SUSPENDED.');
    }

    const targetUser = await findUserById(id);
    if (!targetUser) {
      return sendError(res, 404, 'User not found.');
    }

    // Safety guard: Protect against suspending the last remaining admin
    if (targetUser.role === 'admin' && status.toUpperCase() === 'SUSPENDED') {
      const activeAdmins = await countAdminUsers();
      if (activeAdmins <= 1) {
        return sendError(
          res,
          400,
          'Cannot suspend the only remaining active administrator account.'
        );
      }
    }

    const updated = await updateUserAccountStatus(id, status.toUpperCase());

    return sendSuccess(
      res,
      200,
      `User account status updated to ${status.toUpperCase()}.`,
      { user: updated }
    );
  } catch (err) {
    console.error('updateUserStatus error:', err);
    return sendError(res, 500, 'Failed to update user status.', err.message);
  }
};

/**
 * GET /api/v1/admin/documents
 * Admin document list.
 */
const getDocuments = async (req, res) => {
  try {
    const data = await getAllDocumentsForAdmin(req.query);
    return sendSuccess(res, 200, 'Documents fetched for review.', data);
  } catch (err) {
    console.error('getDocuments error:', err);
    return sendError(res, 500, 'Failed to fetch documents.', err.message);
  }
};

/**
 * PATCH /api/v1/admin/documents/:id/verify
 * Verify or Reject document.
 */
const verifyDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!status || !['VERIFIED', 'REJECTED'].includes(status.toUpperCase())) {
      return sendError(res, 400, 'Status must be VERIFIED or REJECTED.');
    }

    const existingDoc = await findDocumentById(id);
    if (!existingDoc) {
      return sendError(res, 404, 'Document not found.');
    }

    const isVerified = status.toUpperCase() === 'VERIFIED';
    if (!isVerified && (!rejectionReason || rejectionReason.trim().length < 3)) {
      return sendError(res, 400, 'Rejection reason is required when rejecting a document.');
    }

    const updated = await updateDocumentStatus(id, {
      status: status.toUpperCase(),
      rejectionReason: isVerified ? null : rejectionReason.trim(),
    });

    // Notify document owner
    try {
      await createNotification({
        userId: existingDoc.user_id,
        title: isVerified ? 'Document Verified ✅' : 'Document Verification Declined ⚠️',
        message: isVerified
          ? `Your ${existingDoc.document_type.replace('_', ' ')} (${existingDoc.file_name}) has been verified.`
          : `Your ${existingDoc.document_type.replace('_', ' ')} was rejected. Reason: ${rejectionReason.trim()}`,
        type: 'document',
        link: '/tenant/profile',
      });
    } catch (notifErr) {
      console.error('Document verification notification error:', notifErr);
    }

    return sendSuccess(res, 200, `Document has been ${status.toLowerCase()}.`, {
      document: updated,
    });
  } catch (err) {
    console.error('verifyDoc error:', err);
    return sendError(res, 500, 'Failed to verify document.', err.message);
  }
};

module.exports = {
  getStats,
  getProperties,
  getPropertyDetails,
  verifyProperty,
  getUsers,
  updateUserStatus,
  getDocuments,
  verifyDoc,
};
