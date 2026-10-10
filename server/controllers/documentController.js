const path = require('path');
const {
  VALID_DOC_TYPES,
  createDocument,
  findDocumentById,
  canUserAccessDocument,
  getDocumentsByUser,
  getDocumentsForOwner,
  deleteDocument,
} = require('../models/documentModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * POST /api/v1/documents/upload
 * Upload a document (tenant, owner, or applicant).
 */
const uploadDoc = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'No document file provided or invalid format.');
    }

    const { document_type, property_id, application_id } = req.body;
    const docType = document_type && VALID_DOC_TYPES.includes(document_type.toUpperCase())
      ? document_type.toUpperCase()
      : 'IDENTITY';

    const fileUrl = `/uploads/documents/${req.file.filename}`;
    const doc = await createDocument({
      userId: req.user.id,
      propertyId: property_id ? parseInt(property_id, 10) : null,
      applicationId: application_id ? parseInt(application_id, 10) : null,
      documentType: docType,
      fileName: req.file.originalname,
      fileUrl,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    return sendSuccess(res, 201, 'Document uploaded successfully and queued for verification.', {
      document: doc,
    });
  } catch (err) {
    console.error('uploadDoc error:', err);
    return sendError(res, 500, 'Failed to upload document.', err.message);
  }
};

/**
 * GET /api/v1/documents/my-documents
 * Get documents uploaded by current tenant/owner or linked to owner's applications.
 */
const getMyDocuments = async (req, res) => {
  try {
    let docs = [];
    if (req.user.role === 'owner') {
      docs = await getDocumentsForOwner(req.user.id, req.query);
    } else {
      docs = await getDocumentsByUser(req.user.id, req.query);
    }

    return sendSuccess(res, 200, 'Documents retrieved successfully.', { documents: docs });
  } catch (err) {
    console.error('getMyDocuments error:', err);
    return sendError(res, 500, 'Failed to retrieve documents.', err.message);
  }
};

/**
 * GET /api/v1/documents/:id
 * Get single document with strict permission check.
 */
const getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await findDocumentById(id);

    if (!doc) {
      return sendError(res, 404, 'Document not found.');
    }

    if (!canUserAccessDocument(req.user, doc)) {
      return sendError(res, 403, 'Forbidden. You do not have permission to view this document.');
    }

    return sendSuccess(res, 200, 'Document retrieved.', { document: doc });
  } catch (err) {
    console.error('getDocument error:', err);
    return sendError(res, 500, 'Failed to fetch document.', err.message);
  }
};

/**
 * DELETE /api/v1/documents/:id
 * Delete document owned by user.
 */
const deleteDoc = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await findDocumentById(id);

    if (!doc) {
      return sendError(res, 404, 'Document not found.');
    }

    if (doc.user_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 403, 'Forbidden. You cannot delete this document.');
    }

    const deleted = await deleteDocument(id, doc.user_id);
    return sendSuccess(res, 200, 'Document deleted successfully.', { document: deleted });
  } catch (err) {
    console.error('deleteDoc error:', err);
    return sendError(res, 500, 'Failed to delete document.', err.message);
  }
};

module.exports = {
  uploadDoc,
  getMyDocuments,
  getDocument,
  deleteDoc,
};
