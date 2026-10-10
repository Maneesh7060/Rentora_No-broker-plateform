const express = require('express');
const { register, login, getMe, changePassword, logout } = require('../controllers/authController');
const { protectRoute } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public Routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected Routes (require valid JWT)
router.get('/me', protectRoute, getMe);
router.post('/change-password', protectRoute, changePassword);

module.exports = router;
