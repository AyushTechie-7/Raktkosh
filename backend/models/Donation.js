const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donationId: {
    type: String,
    unique: true,
    required: true
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bloodBank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  unitsDonated: {
    type: Number,
    required: true,
    min: 1,
    max: 2,
    default: 1
  },
  donationDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: function() {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 42); // Blood expires in 42 days
      return expiry;
    }
  },
  healthScreening: {
    hemoglobin: { type: Number, min: 12, max: 18 },
    bloodPressure: {
      systolic: { type: Number, min: 90, max: 180 },
      diastolic: { type: Number, min: 60, max: 120 }
    },
    pulse: { type: Number, min: 50, max: 100 },
    temperature: { type: Number, min: 36, max: 38 },
    weight: { type: Number, min: 45 },
    screeningNotes: String
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'rejected', 'processed'],
    default: 'scheduled'
  },
  testResults: {
    hiv: { type: Boolean, default: false },
    hepatitisB: { type: Boolean, default: false },
    hepatitisC: { type: Boolean, default: false },
    syphilis: { type: Boolean, default: false },
    malaria: { type: Boolean, default: false },
    testedAt: Date,
    labTechnician: String,
    isSafe: { type: Boolean, default: false }
  },
  processingInfo: {
    processedAt: Date,
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    components: [{
      type: String,
      enum: ['whole_blood', 'red_cells', 'platelets', 'plasma', 'cryoprecipitate']
    }]
  },
  notes: String,
  location: {
    type: {
      type: String,
      enum: ['blood_bank', 'mobile_camp', 'hospital'],
      default: 'blood_bank'
    },
    name: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  }
}, {
  timestamps: true
});

// Generate unique donation ID
donationSchema.pre('save', async function(next) {
  if (!this.donationId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.donationId = `DON-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Update inventory and donor stats after successful donation
donationSchema.post('save', async function(doc) {
  if (doc.status === 'completed' && doc.testResults.isSafe) {
    const User = mongoose.model('User');
    const BloodInventory = mongoose.model('BloodInventory');
    
    try {
      // Update donor statistics
      await User.findByIdAndUpdate(doc.donor, {
        $inc: { 'donorStatus.totalDonations': doc.unitsDonated },
        $set: { 
          'donorStatus.lastDonationDate': doc.donationDate,
          'donorStatus.nextEligibleDate': new Date(doc.donationDate.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days
        }
      });
      
      // Update blood inventory
      await BloodInventory.findOneAndUpdate(
        { 
          bloodBank: doc.bloodBank, 
          bloodGroup: doc.bloodGroup 
        },
        { 
          $inc: { currentStock: doc.unitsDonated },
          $push: {
            expiryDates: {
              units: doc.unitsDonated,
              expiryDate: doc.expiryDate
            }
          },
          $set: { lastUpdated: new Date() }
        },
        { upsert: true, new: true }
      );
      
      console.log(`✅ Updated inventory for ${doc.bloodGroup}: +${doc.unitsDonated} units`);
      
    } catch (error) {
      console.error('❌ Error updating inventory/donor stats:', error);
    }
  }
});

// Check if donation is expired
donationSchema.methods.isExpired = function() {
  return new Date() > this.expiryDate;
};

// Method to approve test results
donationSchema.methods.approveTestResults = function(labTechnician) {
  this.testResults.testedAt = new Date();
  this.testResults.labTechnician = labTechnician;
  this.testResults.isSafe = true;
  this.status = 'processed';
  this.processingInfo.processedAt = new Date();
};

module.exports = mongoose.model('Donation', donationSchema);