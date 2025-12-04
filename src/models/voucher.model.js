/**
 * File: models/voucher.model.js
 * 
 * Mô tả: Định nghĩa schema và model cho voucher (mã giảm giá)
 * - Quản lý thông tin voucher: code, discountPct, quantityTotal, quantityClaimed
 * - Quản lý thời gian: startDate, endDate
 * - Virtual fields: quantityRemaining (số lượng còn lại), status (trạng thái)
 * - Index để tối ưu truy vấn theo code, location, và thời gian
 * 
 * Công nghệ sử dụng:
 * - Mongoose: ODM cho MongoDB
 * - Mongoose Virtuals: Tạo trường ảo (quantityRemaining, status)
 * - MongoDB Indexes: Tối ưu truy vấn
 */

const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Vui lòng nhập mã voucher'],
    unique: true,
    trim: true,
    uppercase: true,
    minlength: [3, 'Mã voucher phải có ít nhất 3 ký tự'],
    maxlength: [20, 'Mã voucher không được vượt quá 20 ký tự']
  },
  discountPct: {
    type: Number,
    required: [true, 'Vui lòng nhập phần trăm giảm giá'],
    min: [1, 'Giảm giá tối thiểu là 1%'],
    max: [100, 'Giảm giá tối đa là 100%']
  },
  quantityTotal: {
    type: Number,
    required: [true, 'Vui lòng nhập số lượng voucher'],
    min: [1, 'Số lượng tối thiểu là 1']
  },
  quantityClaimed: {
    type: Number,
    default: 0,
    min: [0, 'Số lượng đã nhận không được âm']
  },
  startDate: {
    type: Date,
    required: [true, 'Vui lòng nhập ngày bắt đầu']
  },
  endDate: {
    type: Date,
    required: [true, 'Vui lòng nhập ngày kết thúc']
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'Vui lòng chọn địa điểm áp dụng voucher']
  },
  conditions: {
    type: String,
    trim: true,
    maxlength: [300, 'Điều kiện áp dụng không được vượt quá 300 ký tự']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

voucherSchema.virtual('quantityRemaining').get(function () {
  return this.quantityTotal - this.quantityClaimed;
});

voucherSchema.virtual('status').get(function () {
  const now = new Date();
  if (now < this.startDate) return 'sắp diễn ra';
  if (now > this.endDate) return 'hết hạn';
  if (this.quantityClaimed >= this.quantityTotal) return 'hết lượt';
  return 'đang hoạt động';
});

voucherSchema.set('toJSON', { virtuals: true });

voucherSchema.index({ code: 1 });
voucherSchema.index({ location: 1 });
voucherSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Voucher', voucherSchema);
