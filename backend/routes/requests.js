const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const BloodRequest = require('../models/BloodRequest');
const User = require('../models/user');

// Create blood request
router.post('/', auth, async (req, res) => {
  try {
    const {
      patientName,
      bloodGroup,
      unitsRequired,
      urgency,
      hospital,
      location,
      contactInfo
    } = req.body;

    const request = new BloodRequest({
      patientName,
      bloodGroup,
      unitsRequired,
      urgency,
      hospital,
      location,
      contactInfo,
      requestedBy: req.user.userId
    });

    await request.save();

    res.status(201).json({
      success: true,
      message: 'Blood request created successfully',
      data: { request }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create blood request',
      error: error.message
    });
  }
});

// Get all blood requests
router.get('/', auth, async (req, res) => {
  try {
    const { status, bloodGroup, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (bloodGroup) query.bloodGroup = bloodGroup;

    const requests = await BloodRequest.find(query)
      .populate('requestedBy', 'name email phone')
      .populate('assignedBloodBank', 'name email phone')
      .populate('assignedDonor', 'name email phone bloodGroup')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BloodRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        requests,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blood requests',
      error: error.message
    });
  }
});

// Update request status
router.put('/:requestId/status', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    const request = await BloodRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found'
      });
    }

    request.status = status;
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Request status updated successfully',
      data: { request }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update request status',
      error: error.message
    });
  }
});

// Fulfill request
router.post('/:requestId/fulfill', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { unitsProvided, notes } = req.body;

    const request = await BloodRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found'
      });
    }

    request.fulfill(req.user.userId, unitsProvided, notes);
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Request fulfilled successfully',
      data: { request }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fulfill request',
      error: error.message
    });
  }
});

// Get matching donors for a request
router.get('/:requestId/matching-donors', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await BloodRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found'
      });
    }

    const matchingDonors = await User.find({
      role: 'donor',
      bloodGroup: request.bloodGroup,
      'donorStatus.isEligible': true,
      'address.city': request.location?.city,
      isActive: true
    }).select('name email phone bloodGroup address donorStatus');

    res.status(200).json({
      success: true,
      data: { matchingDonors }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matching donors',
      error: error.message
    });
  }
});

// Get request statistics
router.get('/stats', auth, authorize('admin', 'bloodbank'), async (req, res) => {
  try {
    const stats = await BloodRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalUnits: { $sum: '$unitsRequired' }
        }
      }
    ]);

    const bloodGroupStats = await BloodRequest.aggregate([
      {
        $group: {
          _id: '$bloodGroup',
          totalRequests: { $sum: 1 },
          fulfilledRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'fulfilled'] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        byBloodGroup: bloodGroupStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch request statistics',
      error: error.message
    });
  }
});

module.exports = router;