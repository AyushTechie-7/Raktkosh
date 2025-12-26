const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    unique: true,
    required: true
  },
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  unitsRequired: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  hospital: {
    name: String,
    address: String,
    contact: String
  },
  location: {
    city: String,
    state: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contactInfo: {
    name: String,
    phone: String,
    email: String,
    relationship: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'fulfilled', 'cancelled'],
    default: 'pending'
  },
  assignedBloodBank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDonor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fulfillmentDetails: {
    fulfilledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    fulfilledAt: Date,
    unitsProvided: Number,
    notes: String
  },
  expiryDate: {
    type: Date,
    default: function() {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7); // Request expires in 7 days
      return expiry;
    }
  }
}, {
  timestamps: true
});

// Generate unique request ID before saving
bloodRequestSchema.pre('save', async function(next) {
  if (!this.requestId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    this.requestId = `REQ-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Check if request is expired
bloodRequestSchema.methods.isExpired = function() {
  return new Date() > this.expiryDate;
};

// Method to fulfill request
bloodRequestSchema.methods.fulfill = function(fulfilledBy, unitsProvided, notes = '') {
  this.status = 'fulfilled';
  this.fulfillmentDetails = {
    fulfilledBy: fulfilledBy,
    fulfilledAt: new Date(),
    unitsProvided: unitsProvided,
    notes: notes
  };
};

// Static method to find matching donors
bloodRequestSchema.statics.findMatchingDonors = async function(requestId) {
  const request = await this.findById(requestId);
  if (!request) return [];
  
  return await mongoose.model('User').find({
    role: 'donor',
    bloodGroup: request.bloodGroup,
    'donorStatus.isEligible': true,
    'address.city': request.location.city,
    isActive: true
  });
};

// Index for better query performance
bloodRequestSchema.index({ bloodGroup: 1, status: 1 });
bloodRequestSchema.index({ location: 1 });
bloodRequestSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);