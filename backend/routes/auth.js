const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  register,
  login,
  getProfile,
  updateProfile,
  logout
} = require('../controllers/authController');

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    service: 'auth', 
    status: 'active',
    message: 'Auth API is working'
  });
});

// Register user
router.post('/register', register);

// Login user
router.post('/login', login);

// Get user profile
router.get('/profile', auth, getProfile);

// Update user profile
router.put('/profile', auth, updateProfile);

// Logout user
router.post('/logout', auth, logout);

module.exports = router;