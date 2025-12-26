const Donation = require('../models/Donation');
const User = require('../models/user');
const BloodInventory = require('../models/BloodInventory');
const BloodRequest = require('../models/BloodRequest');

// Schedule new donation
const scheduleDonation = async (req, res) => {
  try {
    const { donorId, bloodBankId, bloodGroup, unitsDonated, donationDate, location } = req.body;
    
    // Verify donor exists and is eligible
    const donor = await User.findById(donorId);
    if (!donor) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    if (donor.role !== 'donor') {
      return res.status(400).json({
        success: false,
        message: 'User is not a donor'
      });
    }

    if (!donor.isEligibleToDonate()) {
      return res.status(400).json({
        success: false,
        message: 'Donor is not eligible to donate at this time'
      });
    }

    const donation = new Donation({
      donor: donorId,
      bloodBank: bloodBankId,
      bloodGroup: bloodGroup,
      unitsDonated: unitsDonated || 1,
      donationDate: donationDate || new Date(),
      location: location
    });

    await donation.save();

    // Populate the response with donor info
    await donation.populate('donor', 'name email phone bloodGroup');
    await donation.populate('bloodBank', 'name email phone address');

    res.status(201).json({
      success: true,
      message: 'Donation scheduled successfully',
      data: { donation }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to schedule donation',
      error: error.message
    });
  }
};

// Complete donation with health screening
const completeDonation = async (req, res) => {
  try {
    const { donationId } = req.params;
    const { healthScreening, notes } = req.body;

    const donation = await Donation.findById(donationId)
      .populate('donor')
      .populate('bloodBank');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    if (donation.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Donation already completed'
      });
    }

    // Update donation status and health screening
    donation.status = 'completed';
    donation.healthScreening = healthScreening;
    donation.notes = notes;

    await donation.save();

    res.status(200).json({
      success: true,
      message: 'Donation completed successfully',
      data: { donation }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to complete donation',
      error: error.message
    });
  }
};

// Process donation test results
const processTestResults = async (req, res) => {
  try {
    const { donationId } = req.params;
    const { testResults, labTechnician } = req.body;

    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    if (donation.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Donation must be completed before processing tests'
      });
    }

    // Update test results
    donation.testResults = {
      ...donation.testResults,
      ...testResults,
      testedAt: new Date(),
      labTechnician: labTechnician
    };

    // Mark as safe if all tests are negative
    const isSafe = !testResults.hiv && !testResults.hepatitisB && 
                   !testResults.hepatitisC && !testResults.syphilis && !testResults.malaria;
    
    donation.testResults.isSafe = isSafe;
    donation.status = isSafe ? 'processed' : 'rejected';

    await donation.save();

    const message = isSafe 
      ? 'Blood tests passed. Blood is safe for transfusion.'
      : 'Blood tests failed. Blood rejected.';

    res.status(200).json({
      success: true,
      message: message,
      data: { donation }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process test results',
      error: error.message
    });
  }
};

// Get donations with filters
const getDonations = async (req, res) => {
  try {
    const { 
      status, 
      bloodGroup, 
      bloodBank, 
      donor,
      startDate, 
      endDate,
      page = 1, 
      limit = 10 
    } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (bloodBank) query.bloodBank = bloodBank;
    if (donor) query.donor = donor;
    
    // Date range filter
    if (startDate || endDate) {
      query.donationDate = {};
      if (startDate) query.donationDate.$gte = new Date(startDate);
      if (endDate) query.donationDate.$lte = new Date(endDate);
    }

    const donations = await Donation.find(query)
      .populate('donor', 'name email phone bloodGroup address')
      .populate('bloodBank', 'name email phone address')
      .sort({ donationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Donation.countDocuments(query);

    // Get statistics
    const stats = await Donation.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalUnits: { $sum: '$unitsDonated' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        donations,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
        stats
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donations',
      error: error.message
    });
  }
};

// Get donation statistics
const getDonationStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const stats = await Donation.aggregate([
      {
        $match: {
          donationDate: { $gte: startDate },
          status: 'processed'
        }
      },
      {
        $group: {
          _id: '$bloodGroup',
          totalDonations: { $sum: 1 },
          totalUnits: { $sum: '$unitsDonated' },
          averageUnits: { $avg: '$unitsDonated' }
        }
      }
    ]);

    const monthlyTrend = await Donation.aggregate([
      {
        $match: {
          donationDate: { $gte: startDate },
          status: 'processed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$donationDate' },
            month: { $month: '$donationDate' },
            bloodGroup: '$bloodGroup'
          },
          units: { $sum: '$unitsDonated' },
          donations: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        byBloodGroup: stats,
        monthlyTrend: monthlyTrend,
        period: period
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donation statistics',
      error: error.message
    });
  }
};

module.exports = {
  scheduleDonation,
  completeDonation,
  processTestResults,
  getDonations,
  getDonationStats
};