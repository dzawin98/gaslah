const express = require('express');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword
} = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  validateCreateUser,
  validateUpdateUser
} = require('../middleware/validation');

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

// Get all users
router.get('/', getUsers);

// Get user by ID
router.get('/:id', getUserById);

// Create new user
router.post('/', validateCreateUser, createUser);

// Update user
router.put('/:id', validateUpdateUser, updateUser);

// Delete user
router.delete('/:id', deleteUser);

// Reset user password
router.post('/:id/reset-password', resetUserPassword);

module.exports = router;