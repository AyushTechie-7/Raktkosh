const mongoose = require('mongoose');

const bloodInventorySchema = new mongoose.Schema({
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
  currentStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reservedStock: {
    type: Number,
    default: 0,
    min: 0
  },
  capacity: {
    type: Number,
    required: true,
    min: 0,
    default: 100
  },
  criticalLevel: {
    type: Number,
    default: 10 // percentage
  },
  lowLevel: {
    type: Number,
    default: 20 // percentage
  },
  expiryDates: [{
    units: Number,
    expiryDate: Date,
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation'
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  alerts: [{
    type: {
      type: String,
      enum: ['low_stock', 'expiring_soon', 'critical_stock'],
      required: true
    },
    message: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Virtual for available stock (current - reserved)
bloodInventorySchema.virtual('availableStock').get(function() {
  return Math.max(0, this.currentStock - this.reservedStock);
});

// Virtual for utilization percentage
bloodInventorySchema.virtual('utilization').get(function() {
  return (this.currentStock / this.capacity) * 100;
});

// Virtual for stock status
bloodInventorySchema.virtual('status').get(function() {
  const utilization = this.utilization;
  if (utilization <= this.criticalLevel) return 'critical';
  if (utilization <= this.lowLevel) return 'low';
  return 'adequate';
});

// Check for expiring blood
bloodInventorySchema.methods.getExpiringSoon = function(days = 7) {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + days);
  
  return this.expiryDates.filter(expiry => 
    expiry.expiryDate <= threshold && expiry.expiryDate > new Date()
  );
};

// Method to add stock from donation
bloodInventorySchema.methods.addStockFromDonation = function(donationId, units, expiryDate) {
  this.currentStock += units;
  this.lastUpdated = new Date();
  
  this.expiryDates.push({
    units: units,
    expiryDate: expiryDate,
    donation: donationId
  });
};

// Method to remove stock for request
bloodInventorySchema.methods.removeStock = function(units, requestId) {
  if (this.availableStock < units) {
    throw new Error(`Insufficient stock available. Available: ${this.availableStock}, Requested: ${units}`);
  }
  
  this.currentStock -= units;
  this.lastUpdated = new Date();
  
  // Create alert if stock goes low
  if (this.utilization <= this.lowLevel) {
    this.alerts.push({
      type: 'low_stock',
      message: `${this.bloodGroup} stock is low: ${this.currentStock} units remaining`,
      severity: this.utilization <= this.criticalLevel ? 'high' : 'medium'
    });
  }
};

// Static method to get low stock alerts across all blood banks
bloodInventorySchema.statics.getSystemWideAlerts = async function() {
  return await this.aggregate([
    {
      $match: {
        $expr: {
          $lte: [
            { $multiply: [{ $divide: ['$currentStock', '$capacity'] }, 100] },
            '$lowLevel'
          ]
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'bloodBank',
        foreignField: '_id',
        as: 'bloodBankInfo'
      }
    },
    {
      $project: {
        bloodGroup: 1,
        currentStock: 1,
        capacity: 1,
        utilization: { $multiply: [{ $divide: ['$currentStock', '$capacity'] }, 100] },
        bloodBankName: { $arrayElemAt: ['$bloodBankInfo.name', 0] },
        bloodBankCity: { $arrayElemAt: ['$bloodBankInfo.address.city', 0] },
        status: {
          $cond: [
            { $lte: [{ $multiply: [{ $divide: ['$currentStock', '$capacity'] }, 100] }, '$criticalLevel'] },
            'critical',
            'low'
          ]
        }
      }
    },
    { $sort: { utilization: 1 } }
  ]);
};

module.exports = mongoose.model('BloodInventory', bloodInventorySchema);