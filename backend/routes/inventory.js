const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const {
  getInventory,
  updateInventory,
  getLowStockAlerts,
  getInventoryAnalytics,
  getSystemWideInventory
} = require('../controllers/bloodInventoryController');

// Get inventory for specific blood bank or system-wide for admin
router.get('/', auth, getInventory);

// Update inventory
router.put('/update', auth, authorize('bloodbank', 'admin'), updateInventory);

// Get low stock alerts
router.get('/alerts', auth, getLowStockAlerts);

// Get inventory analytics
router.get('/analytics', auth, getInventoryAnalytics);

// System-wide inventory (admin only)
router.get('/system-wide', auth, authorize('admin'), getSystemWideInventory);

module.exports = router;