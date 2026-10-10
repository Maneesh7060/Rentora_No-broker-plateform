const {
  findUserByEmail,
  findUserById,
  createUser,
  emailExists,
  updateUserPassword,
} = require('../models/userModel');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// Allowed roles for self-registration (admin cannot self-register)
const ALLOWED_ROLES = ['tenant', 'owner', 'agent', 'maintenance'];

// ========================================================
// POST /api/auth/register
// ========================================================
const register = async (req, res) => {
  try {
    const { full_name, email, password, phone, role } = req.body;

    // --- Input Validation ---
    if (!full_name || !email || !password) {
      return sendError(res, 400, 'Full name, email, and password are required.');
    }

    if (full_name.trim().length < 2) {
      return sendError(res, 400, 'Full name must be at least 2 characters.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, 'Please provide a valid email address.');
    }

    if (password.length < 8) {
      return sendError(res, 400, 'Password must be at least 8 characters long.');
    }

    const assignedRole = role && ALLOWED_ROLES.includes(role) ? role : 'tenant';

    // --- Check for Duplicate Email ---
    const exists = await emailExists(email.toLowerCase());
    if (exists) {
      return sendError(res, 409, 'An account with this email already exists.');
    }

    // --- Hash Password & Create User ---
    const password_hash = await hashPassword(password);
    const newUser = await createUser({
      full_name: full_name.trim(),
      email: email.toLowerCase().trim(),
      password_hash,
      phone: phone || null,
      role: assignedRole,
    });

    // --- Generate JWT ---
    const token = generateToken({ id: newUser.id, email: newUser.email, role: newUser.role });

    return sendSuccess(res, 201, 'Account created successfully.', {
      token,
      user: newUser, // password_hash is NOT included
    });
  } catch (err) {
    console.error('Register error:', err);
    return sendError(res, 500, 'Registration failed. Please try again.', err.message);
  }
};

// ========================================================
// POST /api/auth/login
// ========================================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Input Validation ---
    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required.');
    }

    // --- Find User ---
    const user = await findUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    // Check account status
    if (user.account_status === 'SUSPENDED') {
      return sendError(
        res,
        403,
        'Your account has been suspended by the administrator. Please contact support.'
      );
    }

    // --- Verify Password ---
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    // --- Generate JWT ---
    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    // --- Strip password_hash before returning ---
    const { password_hash, ...safeUser } = user;

    return sendSuccess(res, 200, 'Login successful.', { token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    return sendError(res, 500, 'Login failed. Please try again.', err.message);
  }
};

// ========================================================
// GET /api/auth/me
// ========================================================
const getMe = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return sendError(res, 404, 'User account not found.');
    }
    return sendSuccess(res, 200, 'User profile retrieved.', { user });
  } catch (err) {
    console.error('GetMe error:', err);
    return sendError(res, 500, 'Could not retrieve profile.', err.message);
  }
};

// ========================================================
// POST /api/auth/change-password
// ========================================================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, 400, 'Current password and new password are required.');
    }

    if (newPassword.length < 8) {
      return sendError(res, 400, 'New password must be at least 8 characters long.');
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return sendError(res, 400, 'New password and confirmation password do not match.');
    }

    // Fetch user with password_hash
    const user = await findUserByEmail(req.user.email);
    if (!user) {
      return sendError(res, 404, 'User account not found.');
    }

    const isMatch = await comparePassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return sendError(res, 400, 'Current password is incorrect.');
    }

    const newHash = await hashPassword(newPassword);
    await updateUserPassword(user.id, newHash);

    return sendSuccess(res, 200, 'Password changed successfully. Please keep it safe.');
  } catch (err) {
    console.error('Change password error:', err);
    return sendError(res, 500, 'Failed to update password.', err.message);
  }
};

// ========================================================
// POST /api/auth/logout
// ========================================================
const logout = async (req, res) => {
  return sendSuccess(res, 200, 'Logged out successfully.');
};

module.exports = { register, login, getMe, changePassword, logout };
