const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Voucher code is required'],
    unique: true,
    trim: true,
    uppercase: true,
    minlength: [3, 'Voucher code must be at least 3 characters'],
    maxlength: [20, 'Voucher code cannot exceed 20 characters']
  },
  discountPct: {
    type: Number,
    required: [true, 'Discount percentage is required'],
    min: [1, 'Discount must be at least 1%'],
    max: [100, 'Discount cannot exceed 100%']
  },
  quantityTotal: {
    type: Number,
    required: [true, 'Total quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  quantityClaimed: {
    type: Number,
    default: 0,
    min: [0, 'Claimed quantity cannot be negative']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'Location is required']
  },
  conditions: {
    type: String,
    trim: true,
    maxlength: [300, 'Conditions cannot exceed 300 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for remaining quantity
voucherSchema.virtual('quantityRemaining').get(function() {
  return this.quantityTotal - this.quantityClaimed;
});

// Virtual for status
voucherSchema.virtual('status').get(function() {
  const now = new Date();
  if (now < this.startDate) return 'upcoming';
  if (now > this.endDate) return 'expired';
  if (this.quantityClaimed >= this.quantityTotal) return 'sold_out';
  return 'active';
});

// Ensure virtual fields are serialized
voucherSchema.set('toJSON', { virtuals: true });

// Index for better performance
voucherSchema.index({ code: 1 });
voucherSchema.index({ location: 1 });
voucherSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Voucher', voucherSchema);
