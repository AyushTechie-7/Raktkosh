const BloodInventory = require('../models/BloodInventory');
const Donation = require('../models/Donation');

// Get inventory for blood bank or system-wide for admin
const getInventory = async (req, res) => {
  try {
    const { bloodBankId } = req.query;
    const userRole = req.user.role;
    
    let query = {};
    
    // Admin can view all inventory, others only their own
    if (userRole !== 'admin' && !bloodBankId) {
      if (userRole === 'bloodbank') {
        query.bloodBank = req.user.userId;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }
    
    if (bloodBankId) {
      query.bloodBank = bloodBankId;
    }

    const inventory = await BloodInventory.find(query)
      .populate('bloodBank', 'name email phone address')
      .sort({ bloodGroup: 1 });

    // Get summary statistics
    const summary = await BloodInventory.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalStock: { $sum: '$currentStock' },
          totalCapacity: { $sum: '$capacity' },
          lowStockCount: {
            $sum: {
              $cond: [
                { $lte: [{ $multiply: [{ $divide: ['$currentStock', '$capacity'] }, 100] }, '$lowLevel'] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        inventory,
        summary: summary[0] || {}
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory',
      error: error.message
    });
  }
};

// Update inventory
const updateInventory = async (req, res) => {
  try {
    const { bloodGroup, units, operation } = req.body;
    const bloodBankId = req.user.role === 'admin' ? req.body.bloodBankId : req.user.userId;

    if (!bloodBankId) {
      return res.status(400).json({
        success: false,
        message: 'Blood bank ID is required'
      });
    }

    let inventory = await BloodInventory.findOne({
      bloodBank: bloodBankId,
      bloodGroup: bloodGroup
    });

    if (!inventory) {
      inventory = new BloodInventory({
        bloodBank: bloodBankId,
        bloodGroup: bloodGroup,
        currentStock: 0,
        capacity: 100
      });
    }

    if (operation === 'add') {
      inventory.currentStock += units;
    } else if (operation === 'remove') {
      if (inventory.availableStock < units) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${inventory.availableStock}, Requested: ${units}`
        });
      }
      inventory.currentStock -= units;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid operation. Use "add" or "remove"'
      });
    }

    inventory.lastUpdated = new Date();
    await inventory.save();

    res.status(200).json({
      success: true,
      message: `Inventory updated successfully`,
      data: { inventory }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory',
      error: error.message
    });
  }
};

// Get low stock alerts
const getLowStockAlerts = async (req, res) => {
  try {
    const userRole = req.user.role;
    let query = {};

    // Admin sees all alerts, blood banks see only their own
    if (userRole !== 'admin') {
      if (userRole === 'bloodbank') {
        query.bloodBank = req.user.userId;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const lowStock = await BloodInventory.find({
      ...query,
      $expr: {
        $lte: [
          { $multiply: [{ $divide: ['$currentStock', '$capacity'] }, 100] },
          '$lowLevel'
        ]
      }
    })
    .populate('bloodBank', 'name address city phone')
    .sort({ bloodGroup: 1 });

    // Get system-wide alerts for admin
    let systemAlerts = [];
    if (userRole === 'admin') {
      systemAlerts = await BloodInventory.getSystemWideAlerts();
    }

    res.status(200).json({
      success: true,
      data: {
        lowStock,
        systemAlerts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock alerts',
      error: error.message
    });
  }
};

// Get inventory analytics
const getInventoryAnalytics = async (req, res) => {
  try {
    const userRole = req.user.role;
    let query = {};

    if (userRole === 'bloodbank') {
      query.bloodBank = req.user.userId;
    } else if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const inventory = await BloodInventory.find(query);
    const analytics = await BloodInventory.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$bloodGroup',
          totalStock: { $sum: '$currentStock' },
          totalCapacity: { $sum: '$capacity' },
          averageUtilization: { $avg: { $multiply: [{ $divide: ['$currentStock', '$capacity'] }, 100] } }
        }
      }
    ]);

    const statusCount = {
      critical: inventory.filter(item => item.status === 'critical').length,
      low: inventory.filter(item => item.status === 'low').length,
      adequate: inventory.filter(item => item.status === 'adequate').length
    };

    res.status(200).json({
      success: true,
      data: {
        byBloodGroup: analytics,
        statusCount,
        totalInventory: inventory.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};

// System-wide inventory (admin only)
const getSystemWideInventory = async (req, res) => {
  try {
    const systemInventory = await BloodInventory.aggregate([
      {
        $group: {
          _id: '$bloodGroup',
          totalStock: { $sum: '$currentStock' },
          totalCapacity: { $sum: '$capacity' },
          bloodBanks: { $addToSet: '$bloodBank' },
          averageUtilization: { $avg: { $multiply: [{ $divide: ['$currentStock', '$capacity'] }, 100] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'bloodBanks',
          foreignField: '_id',
          as: 'bloodBankInfo'
        }
      },
      {
        $project: {
          bloodGroup: '$_id',
          totalStock: 1,
          totalCapacity: 1,
          utilization: '$averageUtilization',
          bloodBankCount: { $size: '$bloodBanks' },
          status: {
            $cond: [
              { $lte: ['$averageUtilization', 10] },
              'critical',
              {
                $cond: [
                  { $lte: ['$averageUtilization', 20] },
                  'low',
                  'adequate'
                ]
              }
            ]
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: systemInventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system-wide inventory',
      error: error.message
    });
  }
};

module.exports = {
  getInventory,
  updateInventory,
  getLowStockAlerts,
  getInventoryAnalytics,
  getSystemWideInventory
};