const {
  findNearbySocieties,
  findSocietyById,
  listSocieties,
} = require('../models/societyModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Find societies near coordinates within a radius (in km)
 * GET /api/v1/societies/nearby?latitude=28.3096&longitude=77.5575&radius=10
 */
const getNearbySocieties = async (req, res, next) => {
  try {
    const { latitude, longitude, radius, limit } = req.query;

    if (!latitude || !longitude) {
      return sendError(
        res,
        400,
        'Latitude and longitude parameters are required for nearby society search.'
      );
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseFloat(radius) || 10;

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return sendError(res, 400, 'Invalid latitude or longitude coordinates provided.');
    }

    const result = await findNearbySocieties({
      latitude: lat,
      longitude: lng,
      radius: rad,
      limit: limit ? parseInt(limit, 10) : 50,
    });

    return sendSuccess(res, 200, 'Nearby societies retrieved successfully.', {
      societies: result.societies,
      total: result.total,
      radius_km: rad,
      counts_by_radius: result.counts_by_radius,
      search_center: {
        latitude: lat,
        longitude: lng,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get details for a specific society
 * GET /api/v1/societies/:id
 */
const getSocietyDetails = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return sendError(res, 400, 'Invalid society ID.');
    }

    const society = await findSocietyById(id);
    if (!society) {
      return sendError(res, 404, 'Society not found.');
    }

    return sendSuccess(res, 200, 'Society details retrieved successfully.', {
      society,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List all societies (with optional search/city filters)
 * GET /api/v1/societies
 */
const getAllSocieties = async (req, res, next) => {
  try {
    const { search, city, limit, offset } = req.query;

    const societies = await listSocieties({
      search,
      city,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return sendSuccess(res, 200, 'Societies list retrieved.', societies);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNearbySocieties,
  getSocietyDetails,
  getAllSocieties,
};
