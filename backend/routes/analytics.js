const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');

// Health check for analytics route
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    service: 'analytics', 
    status: 'active',
    message: 'Analytics API is working'
  });
});

// Get dashboard stats
router.get('/dashboard', auth, async (req, res) => {
  try {
    // Mock data for now - implement real analytics later
    const stats = {
      totalDonors: 1250,
      totalRequests: 345,
      totalDonations: 890,
      totalBloodBanks: 23,
      lowStockAlerts: 5,
      recentActivity: [
        { type: 'donation', message: 'New donation from John Doe', time: '2 hours ago' },
        { type: 'request', message: 'Blood request from City Hospital', time: '4 hours ago' },
        { type: 'inventory', message: 'Low stock alert for O-', time: '6 hours ago' }
      ]
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

// Get blood usage analytics
router.get('/blood-usage', auth, authorize('admin', 'bloodbank'), async (req, res) => {
  try {
    const bloodUsage = [
      { bloodGroup: 'A+', usage: 45, requests: 23 },
      { bloodGroup: 'B+', usage: 38, requests: 19 },
      { bloodGroup: 'O+', usage: 52, requests: 28 },
      { bloodGroup: 'AB+', usage: 8, requests: 4 },
      { bloodGroup: 'A-', usage: 15, requests: 8 },
      { bloodGroup: 'B-', usage: 12, requests: 6 },
      { bloodGroup: 'O-', usage: 18, requests: 10 },
      { bloodGroup: 'AB-', usage: 4, requests: 2 }
    ];

    res.json({
      success: true,
      data: bloodUsage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blood usage analytics',
      error: error.message
    });
  }
});

module.exports = router;