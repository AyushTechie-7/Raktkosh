const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/user');
const BloodInventory = require('../models/BloodInventory');

// Get all blood banks
router.get('/', auth, async (req, res) => {
  try {
    const { city, page = 1, limit = 10 } = req.query;
    
    const query = { role: 'bloodbank', isActive: true };
    if (city) query['address.city'] = new RegExp(city, 'i');

    const bloodBanks = await User.find(query)
      .select('name email phone address isVerified')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        bloodBanks,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blood banks',
      error: error.message
    });
  }
});

// Get blood bank by ID
router.get('/:bloodBankId', auth, async (req, res) => {
  try {
    const { bloodBankId } = req.params;

    const bloodBank = await User.findById(bloodBankId)
      .select('name email phone address isVerified createdAt');

    if (!bloodBank || bloodBank.role !== 'bloodbank') {
      return res.status(404).json({
        success: false,
        message: 'Blood bank not found'
      });
    }

    // Get inventory for this blood bank
    const inventory = await BloodInventory.find({ bloodBank: bloodBankId });

    res.status(200).json({
      success: true,
      data: {
        bloodBank,
        inventory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blood bank',
      error: error.message
    });
  }
});

// Register blood bank (admin only)
router.post('/register', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Blood bank with this email already exists'
      });
    }

    const bloodBank = new User({
      name,
      email,
      password,
      phone,
      address,
      role: 'bloodbank',
      isVerified: true
    });

    await bloodBank.save();

    res.status(201).json({
      success: true,
      message: 'Blood bank registered successfully',
      data: { bloodBank: bloodBank.toPublicJSON() }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to register blood bank',
      error: error.message
    });
  }
});

// Update blood bank
router.put('/:bloodBankId', auth, authorize('admin', 'bloodbank'), async (req, res) => {
  try {
    const { bloodBankId } = req.params;
    const updates = req.body;

    // Remove sensitive fields
    delete updates.password;
    delete updates.role;

    const bloodBank = await User.findByIdAndUpdate(
      bloodBankId,
      updates,
      { new: true, runValidators: true }
    );

    if (!bloodBank || bloodBank.role !== 'bloodbank') {
      return res.status(404).json({
        success: false,
        message: 'Blood bank not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blood bank updated successfully',
      data: { bloodBank: bloodBank.toPublicJSON() }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update blood bank',
      error: error.message
    });
  }
});

module.exports = router;