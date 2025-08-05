const express = require('express');
const rateLimit = require('express-rate-limit');
const { 
  login, 
  refreshToken, 
  logout, 
  getProfile, 
  changePassword 
} = require('../controllers/authController');
const { 
  authenticateToken, 
  requireRole 
} = require('../middleware/auth');
const { 
  validateLogin, 
  validateChangePassword 
} = require('../middleware/validation');

const router = express.Router();

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for password change
const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password changes per hour
  message: {
    success: false,
    message: 'Too many password change attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/login', loginLimiter, validateLogin, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Protected routes
router.get('/profile', authenticateToken, getProfile);
router.post('/change-password', 
  authenticateToken, 
  passwordChangeLimiter, 
  validateChangePassword, 
  changePassword
);

// Health check for auth system
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth system is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;