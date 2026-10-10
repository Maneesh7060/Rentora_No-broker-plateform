const {
  VALID_TYPES,
  VALID_STATUSES,
  VALID_FURNISHING,
  getPublishedProperties,
  findPropertyById,
  getPropertiesByOwnerId,
  createProperty,
  updateProperty,
  deleteProperty,
  getOwnerPropertyStats,
} = require('../models/propertyModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * GET /api/v1/properties
 * Public endpoint to list published properties with search, filters, sorting, and pagination.
 */
const getAllProperties = async (req, res) => {
  try {
    const result = await getPublishedProperties(req.query);
    return sendSuccess(res, 200, 'Properties fetched successfully.', result);
  } catch (err) {
    console.error('getAllProperties error:', err);
    return sendError(res, 500, 'Failed to fetch properties.', err.message);
  }
};

/**
 * GET /api/v1/properties/:id
 * Public endpoint to get single property details.
 */
const getProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id, 10);

    if (isNaN(propertyId)) {
      return sendError(res, 400, 'Invalid property ID.');
    }

    const property = await findPropertyById(propertyId);
    if (!property) {
      return sendError(res, 404, 'Property not found.');
    }

    // If property is not published, only the owner or an admin can view it
    if (property.status !== 'published') {
      const user = req.user;
      const isAuthorized = user && (user.id === property.owner_id || user.role === 'admin');
      if (!isAuthorized) {
        return sendError(res, 404, 'Property not found or is currently not available.');
      }
    }

    return sendSuccess(res, 200, 'Property details retrieved.', { property });
  } catch (err) {
    console.error('getProperty error:', err);
    return sendError(res, 500, 'Failed to retrieve property details.', err.message);
  }
};

/**
 * GET /api/v1/properties/owner/my-properties
 * Protected endpoint for owners/admins to view their own properties (all statuses).
 */
const getMyProperties = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const properties = await getPropertiesByOwnerId(ownerId, req.query);
    const stats = await getOwnerPropertyStats(ownerId);

    return sendSuccess(res, 200, 'Owner properties retrieved.', {
      properties,
      stats,
    });
  } catch (err) {
    console.error('getMyProperties error:', err);
    return sendError(res, 500, 'Failed to retrieve owner properties.', err.message);
  }
};

/**
 * GET /api/v1/properties/owner/stats
 * Protected endpoint for owner dashboard statistics.
 */
const getOwnerStats = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const stats = await getOwnerPropertyStats(ownerId);
    return sendSuccess(res, 200, 'Owner property statistics retrieved.', { stats });
  } catch (err) {
    console.error('getOwnerStats error:', err);
    return sendError(res, 500, 'Failed to retrieve owner stats.', err.message);
  }
};

/**
 * POST /api/v1/properties
 * Protected endpoint (owner, admin) to create a new property.
 */
const addProperty = async (req, res) => {
  try {
    const {
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
    } = req.body;

    // --- Validation ---
    if (!title || !title.trim()) {
      return sendError(res, 400, 'Property title is required.');
    }
    if (title.trim().length < 3) {
      return sendError(res, 400, 'Title must be at least 3 characters long.');
    }

    if (!property_type || !VALID_TYPES.includes(property_type.toLowerCase())) {
      return sendError(
        res,
        400,
        `Invalid property type. Must be one of: ${VALID_TYPES.join(', ')}`
      );
    }

    let assignedFurnishing = 'unfurnished';
    if (furnishing && VALID_FURNISHING.includes(furnishing.toLowerCase())) {
      assignedFurnishing = furnishing.toLowerCase();
    }

    if (rent_amount === undefined || rent_amount === null || isNaN(Number(rent_amount)) || Number(rent_amount) < 0) {
      return sendError(res, 400, 'Valid positive rent amount is required.');
    }

    if (deposit_amount !== undefined && (isNaN(Number(deposit_amount)) || Number(deposit_amount) < 0)) {
      return sendError(res, 400, 'Security deposit must be a non-negative number.');
    }

    if (!address_line || !address_line.trim()) {
      return sendError(res, 400, 'Address line is required.');
    }

    if (!city || !city.trim()) {
      return sendError(res, 400, 'City is required.');
    }

    if (!state || !state.trim()) {
      return sendError(res, 400, 'State is required.');
    }

    if (!zip_code || !zip_code.trim()) {
      return sendError(res, 400, 'Zip / Postal code is required.');
    }

    let assignedStatus = 'published';
    if (status && VALID_STATUSES.includes(status.toLowerCase())) {
      assignedStatus = status.toLowerCase();
    }

    // Explicitly derive owner_id from authenticated user token
    const owner_id = req.user.id;

    const newProperty = await createProperty({
      owner_id,
      title: title.trim(),
      description: description ? description.trim() : '',
      property_type: property_type.toLowerCase(),
      furnishing: assignedFurnishing,
      rent_amount: Number(rent_amount),
      deposit_amount: deposit_amount ? Number(deposit_amount) : 0,
      bedrooms: bedrooms !== undefined && !isNaN(Number(bedrooms)) ? Math.max(0, parseInt(bedrooms, 10)) : 1,
      bathrooms: bathrooms !== undefined && !isNaN(Number(bathrooms)) ? Math.max(0, parseInt(bathrooms, 10)) : 1,
      area_sqft: area_sqft && !isNaN(Number(area_sqft)) ? Math.max(0, parseInt(area_sqft, 10)) : null,
      address_line: address_line.trim(),
      locality: locality ? locality.trim() : null,
      city: city.trim(),
      state: state.trim(),
      zip_code: zip_code.trim(),
      latitude: latitude !== undefined && latitude !== '' && !isNaN(Number(latitude)) ? Number(latitude) : null,
      longitude: longitude !== undefined && longitude !== '' && !isNaN(Number(longitude)) ? Number(longitude) : null,
      amenities: Array.isArray(amenities) ? amenities : [],
      images: Array.isArray(images) ? images : [],
      status: assignedStatus,
    });

    return sendSuccess(res, 201, 'Property created successfully.', { property: newProperty });
  } catch (err) {
    console.error('addProperty error:', err);
    return sendError(res, 500, 'Failed to create property listing.', err.message);
  }
};

/**
 * PUT /api/v1/properties/:id
 * Protected endpoint (owner, admin) to update a property.
 */
const updatePropertyDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id, 10);

    if (isNaN(propertyId)) {
      return sendError(res, 400, 'Invalid property ID.');
    }

    const existing = await findPropertyById(propertyId);
    if (!existing) {
      return sendError(res, 404, 'Property not found.');
    }

    // Authorization: User must be the owner of the property or an admin
    if (existing.owner_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 403, 'Forbidden. You do not have permission to modify this property.');
    }

    const {
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
    } = req.body;

    const updatePayload = {};

    if (title !== undefined) {
      if (!title.trim() || title.trim().length < 3) {
        return sendError(res, 400, 'Title must be at least 3 characters.');
      }
      updatePayload.title = title.trim();
    }

    if (description !== undefined) {
      updatePayload.description = description ? description.trim() : '';
    }

    if (property_type !== undefined) {
      if (!VALID_TYPES.includes(property_type.toLowerCase())) {
        return sendError(res, 400, `Invalid property type. Must be one of: ${VALID_TYPES.join(', ')}`);
      }
      updatePayload.property_type = property_type.toLowerCase();
    }

    if (furnishing !== undefined) {
      if (!VALID_FURNISHING.includes(furnishing.toLowerCase())) {
        return sendError(res, 400, `Invalid furnishing type. Must be one of: ${VALID_FURNISHING.join(', ')}`);
      }
      updatePayload.furnishing = furnishing.toLowerCase();
    }

    if (rent_amount !== undefined) {
      if (isNaN(Number(rent_amount)) || Number(rent_amount) < 0) {
        return sendError(res, 400, 'Rent amount must be a positive number.');
      }
      updatePayload.rent_amount = Number(rent_amount);
    }

    if (deposit_amount !== undefined) {
      if (isNaN(Number(deposit_amount)) || Number(deposit_amount) < 0) {
        return sendError(res, 400, 'Security deposit must be a non-negative number.');
      }
      updatePayload.deposit_amount = Number(deposit_amount);
    }

    if (bedrooms !== undefined) {
      updatePayload.bedrooms = Math.max(0, parseInt(bedrooms, 10) || 0);
    }

    if (bathrooms !== undefined) {
      updatePayload.bathrooms = Math.max(0, parseInt(bathrooms, 10) || 0);
    }

    if (area_sqft !== undefined) {
      updatePayload.area_sqft = area_sqft ? Math.max(0, parseInt(area_sqft, 10) || 0) : null;
    }

    if (address_line !== undefined) {
      if (!address_line.trim()) return sendError(res, 400, 'Address line cannot be empty.');
      updatePayload.address_line = address_line.trim();
    }

    if (locality !== undefined) {
      updatePayload.locality = locality ? locality.trim() : null;
    }

    if (city !== undefined) {
      if (!city.trim()) return sendError(res, 400, 'City cannot be empty.');
      updatePayload.city = city.trim();
    }

    if (state !== undefined) {
      if (!state.trim()) return sendError(res, 400, 'State cannot be empty.');
      updatePayload.state = state.trim();
    }

    if (zip_code !== undefined) {
      if (!zip_code.trim()) return sendError(res, 400, 'Zip code cannot be empty.');
      updatePayload.zip_code = zip_code.trim();
    }

    if (latitude !== undefined) {
      updatePayload.latitude = latitude !== '' && !isNaN(Number(latitude)) ? Number(latitude) : null;
    }

    if (longitude !== undefined) {
      updatePayload.longitude = longitude !== '' && !isNaN(Number(longitude)) ? Number(longitude) : null;
    }

    if (amenities !== undefined) {
      updatePayload.amenities = Array.isArray(amenities) ? amenities : [];
    }

    if (images !== undefined) {
      updatePayload.images = Array.isArray(images) ? images : [];
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status.toLowerCase())) {
        return sendError(res, 400, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
      }
      updatePayload.status = status.toLowerCase();
    }

    const updated = await updateProperty(propertyId, updatePayload);
    return sendSuccess(res, 200, 'Property updated successfully.', { property: updated });
  } catch (err) {
    console.error('updatePropertyDetails error:', err);
    return sendError(res, 500, 'Failed to update property.', err.message);
  }
};

/**
 * DELETE /api/v1/properties/:id
 * Protected endpoint (owner, admin) to delete a property.
 */
const removeProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id, 10);

    if (isNaN(propertyId)) {
      return sendError(res, 400, 'Invalid property ID.');
    }

    const existing = await findPropertyById(propertyId);
    if (!existing) {
      return sendError(res, 404, 'Property not found.');
    }

    // Authorization: User must be the owner of the property or an admin
    if (existing.owner_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 403, 'Forbidden. You do not have permission to delete this property.');
    }

    await deleteProperty(propertyId);
    return sendSuccess(res, 200, 'Property deleted successfully.', { id: propertyId });
  } catch (err) {
    console.error('removeProperty error:', err);
    return sendError(res, 500, 'Failed to delete property.', err.message);
  }
};

/**
 * POST /api/v1/properties/upload-images
 * Protected endpoint to upload property media images.
 */
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return sendError(res, 400, 'No image files uploaded.');
    }

    const uploadedUrls = req.files.map((file) => `/uploads/properties/${file.filename}`);

    return sendSuccess(res, 200, 'Images uploaded successfully.', {
      images: uploadedUrls,
    });
  } catch (err) {
    console.error('uploadImages error:', err);
    return sendError(res, 500, 'Failed to upload property images.', err.message);
  }
};

/**
 * PATCH /api/v1/properties/:id/images
 * Protected endpoint for owner to reorder, set primary, or remove property images.
 */
const updateImages = async (req, res) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id, 10);
    const { images } = req.body;

    if (!Array.isArray(images)) {
      return sendError(res, 400, 'Images must be an array of image URLs.');
    }

    const existing = await findPropertyById(propertyId);
    if (!existing) {
      return sendError(res, 404, 'Property not found.');
    }

    if (existing.owner_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 403, 'Forbidden. You do not own this property.');
    }

    const { updatePropertyImages } = require('../models/propertyModel');
    const updated = await updatePropertyImages(propertyId, images);

    return sendSuccess(res, 200, 'Property images updated.', { property: updated });
  } catch (err) {
    console.error('updateImages error:', err);
    return sendError(res, 500, 'Failed to update images.', err.message);
  }
};

/**
 * PATCH /api/v1/properties/:id/submit-verification
 * Protected endpoint for owner to submit a draft property for admin verification.
 */
const submitVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id, 10);

    const existing = await findPropertyById(propertyId);
    if (!existing) {
      return sendError(res, 404, 'Property not found.');
    }

    if (existing.owner_id !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 403, 'Forbidden. You do not own this property.');
    }

    const { submitPropertyForVerification } = require('../models/propertyModel');
    const updated = await submitPropertyForVerification(propertyId, req.user.id);

    return sendSuccess(res, 200, 'Property submitted for verification.', { property: updated });
  } catch (err) {
    console.error('submitVerification error:', err);
    return sendError(res, 500, 'Failed to submit property for verification.', err.message);
  }
};

module.exports = {
  getAllProperties,
  getProperty,
  getMyProperties,
  getOwnerStats,
  addProperty,
  updatePropertyDetails,
  removeProperty,
  uploadImages,
  updateImages,
  submitVerification,
};
