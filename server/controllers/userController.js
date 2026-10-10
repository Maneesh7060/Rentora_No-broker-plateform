const path = require('path');
const {
  findUserById,
  updateUserProfile,
  getPublicUserProfile,
  calculateProfileCompletion,
} = require('../models/userModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * GET /api/v1/users/profile
 * Get authenticated user's profile with completion metrics.
 */
const getProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return sendError(res, 404, 'User profile not found.');
    }

    const completion = calculateProfileCompletion(user);

    return sendSuccess(res, 200, 'Profile retrieved successfully.', {
      user,
      completion,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return sendError(res, 500, 'Failed to fetch user profile.', err.message);
  }
};

/**
 * PATCH /api/v1/users/profile
 * Update authenticated user's profile details.
 */
const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, bio, city, state, address } = req.body;

    if (full_name !== undefined && full_name.trim().length < 2) {
      return sendError(res, 400, 'Full name must be at least 2 characters long.');
    }

    const updatedUser = await updateUserProfile(req.user.id, {
      full_name: full_name ? full_name.trim() : undefined,
      phone: phone ? phone.trim() : undefined,
      bio: bio !== undefined ? bio.trim() : undefined,
      city: city !== undefined ? city.trim() : undefined,
      state: state !== undefined ? state.trim() : undefined,
      address: address !== undefined ? address.trim() : undefined,
    });

    const completion = calculateProfileCompletion(updatedUser);

    return sendSuccess(res, 200, 'Profile updated successfully.', {
      user: updatedUser,
      completion,
    });
  } catch (err) {
    console.error('Update profile error:', err);
    return sendError(res, 500, 'Failed to update profile.', err.message);
  }
};

/**
 * POST /api/v1/users/avatar
 * Upload and set user profile photo.
 */
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'No image file uploaded or invalid image format.');
    }

    const avatarUrl = `/uploads/profiles/${req.file.filename}`;

    const updatedUser = await updateUserProfile(req.user.id, {
      avatar_url: avatarUrl,
    });

    const completion = calculateProfileCompletion(updatedUser);

    return sendSuccess(res, 200, 'Profile photo updated successfully.', {
      avatar_url: avatarUrl,
      user: updatedUser,
      completion,
    });
  } catch (err) {
    console.error('Upload avatar error:', err);
    return sendError(res, 500, 'Failed to upload profile photo.', err.message);
  }
};

/**
 * GET /api/v1/users/public/:id
 * Public safe profile endpoint (e.g. for property owner details).
 */
const getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await getPublicUserProfile(id);
    if (!profile) {
      return sendError(res, 404, 'User profile not found.');
    }

    return sendSuccess(res, 200, 'Public profile retrieved.', { profile });
  } catch (err) {
    console.error('Get public profile error:', err);
    return sendError(res, 500, 'Failed to load public profile.', err.message);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  getPublicProfile,
};
