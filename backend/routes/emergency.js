const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const BloodRequest = require('../models/BloodRequest');
const User = require('../models/user');

// Create emergency request
router.post('/request', auth, async (req, res) => {
  try {
    const {
      patientName,
      bloodGroup,
      unitsRequired,
      hospital,
      location,
      contactInfo,
      emergencyDetails
    } = req.body;

    const emergencyRequest = new BloodRequest({
      patientName,
      bloodGroup,
      unitsRequired,
      urgency: 'critical',
      hospital,
      location,
      contactInfo,
      requestedBy: req.user.userId,
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await emergencyRequest.save();

    res.status(201).json({
      success: true,
      message: 'Emergency request created successfully',
      data: { request: emergencyRequest }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create emergency request',
      error: error.message
    });
  }
});

// Get emergency contacts
router.get('/contacts', auth, async (req, res) => {
  try {
    const emergencyContacts = [
      {
        name: 'National Emergency',
        number: '112',
        type: 'general'
      },
      {
        name: 'Ambulance',
        number: '102',
        type: 'medical'
      },
      {
        name: 'Police',
        number: '100',
        type: 'safety'
      },
      {
        name: 'Fire Department',
        number: '101',
        type: 'safety'
      },
      {
        name: 'RAKTKOSH Emergency',
        number: '1-800-RAKTKOSH',
        type: 'blood'
      }
    ];

    res.status(200).json({
      success: true,
      data: { emergencyContacts }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch emergency contacts',
      error: error.message
    });
  }
});

// Notify nearby donors for emergency
router.post('/:emergencyId/notify-donors', auth, async (req, res) => {
  try {
    const { emergencyId } = req.params;
    
    const emergencyRequest = await BloodRequest.findById(emergencyId);
    if (!emergencyRequest) {
      return res.status(404).json({
        success: false,
        message: 'Emergency request not found'
      });
    }

    // Find matching donors nearby
    const matchingDonors = await User.find({
      role: 'donor',
      bloodGroup: emergencyRequest.bloodGroup,
      'donorStatus.isEligible': true,
      isActive: true
    }).select('name email phone bloodGroup');

    // In a real application, you would send notifications here
    // For now, we'll just return the count

    res.status(200).json({
      success: true,
      message: `Notified ${matchingDonors.length} potential donors`,
      data: { notifiedDonors: matchingDonors.length }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to notify donors',
      error: error.message
    });
  }
});

module.exports = router;