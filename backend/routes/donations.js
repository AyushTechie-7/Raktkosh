const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  scheduleDonation,
  completeDonation,
  processTestResults,
  getDonations,
  getDonationStats
} = require('../controllers/donationController');

// Schedule new donation
router.post('/schedule', auth, authorize('bloodbank', 'admin'), scheduleDonation);

// Complete donation
router.post('/:donationId/complete', auth, authorize('bloodbank', 'admin'), completeDonation);

// Process test results
router.post('/:donationId/process-tests', auth, authorize('bloodbank', 'admin'), processTestResults);

// Get donations with filters
router.get('/', auth, getDonations);

// Get donation statistics
router.get('/stats', auth, getDonationStats);

module.exports = router;