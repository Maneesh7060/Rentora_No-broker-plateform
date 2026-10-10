const express = require('express');
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  getPublicProfile,
} = require('../controllers/userController');
const { protectRoute } = require('../middlewares/authMiddleware');
const { uploadProfileAvatar } = require('../middlewares/uploadMiddleware');

const router = express.Router();

// Public route
router.get('/public/:id', getPublicProfile);

// Authenticated user profile routes
router.get('/profile', protectRoute, getProfile);
router.patch('/profile', protectRoute, updateProfile);
router.post('/avatar', protectRoute, uploadProfileAvatar.single('avatar'), uploadAvatar);

module.exports = router;
