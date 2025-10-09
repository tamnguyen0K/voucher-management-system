// Import thư viện mongoose để định nghĩa schema và model
const mongoose = require('mongoose');

// Tạo schema cho voucher (mã giảm giá)
const voucherSchema = new mongoose.Schema({
  // Mã code của voucher, ví dụ: "DISCOUNT10"
  code: {
    type: String,
    required: [true, 'Voucher code is required'],         // Bắt buộc phải có
    unique: true,                                         // Không được trùng lặp
    trim: true,                                           // Xóa khoảng trắng đầu/cuối
    uppercase: true,                                      // Tự động chuyển thành chữ in hoa
    minlength: [3, 'Voucher code must be at least 3 characters'],
    maxlength: [20, 'Voucher code cannot exceed 20 characters']
  },

  // Phần trăm giảm giá (từ 1 đến 100)
  discountPct: {
    type: Number,
    required: [true, 'Discount percentage is required'],
    min: [1, 'Discount must be at least 1%'],
    max: [100, 'Discount cannot exceed 100%']
  },

  // Tổng số lượng voucher có sẵn
  quantityTotal: {
    type: Number,
    required: [true, 'Total quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },

  // Số lượng voucher đã được người dùng nhận
  quantityClaimed: {
    type: Number,
    default: 0,
    min: [0, 'Claimed quantity cannot be negative']
  },

  // Thời gian bắt đầu hiệu lực của voucher
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },

  // Thời gian kết thúc hiệu lực
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },

  // Voucher này thuộc về địa điểm nào
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',                                     // Tham chiếu đến model Location
    required: [true, 'Location is required']
  },

  // Điều kiện áp dụng (nếu có)
  conditions: {
    type: String,
    trim: true,
    maxlength: [300, 'Conditions cannot exceed 300 characters']
  },

  // Ngày tạo voucher
  createdAt: {
    type: Date,
    default: Date.now
  }
});


// Virtual field: Số lượng voucher còn lại
voucherSchema.virtual('quantityRemaining').get(function() {
  return this.quantityTotal - this.quantityClaimed;
});


// Virtual field: Trạng thái hiện tại của voucher
voucherSchema.virtual('status').get(function() {
  const now = new Date();
  if (now < this.startDate) return 'upcoming';      // Chưa đến ngày bắt đầu
  if (now > this.endDate) return 'expired';         // Đã hết hạn
  if (this.quantityClaimed >= this.quantityTotal) return 'sold_out'; // Hết lượt
  return 'active';                                  // Đang hoạt động
});


// Cho phép các virtual field hiển thị khi convert sang JSON (ví dụ khi trả về API)
voucherSchema.set('toJSON', { virtuals: true });


// Tạo các chỉ mục (index) để tăng tốc truy vấn
voucherSchema.index({ code: 1 });                    // Tìm nhanh theo mã voucher
voucherSchema.index({ location: 1 });                // Tìm nhanh theo địa điểm
voucherSchema.index({ startDate: 1, endDate: 1 });   // Tìm nhanh theo thời gian hiệu lực


// Tạo model Voucher và export ra để dùng ở nơi khác
// MongoDB sẽ lưu trong collection "vouchers"
module.exports = mongoose.model('Voucher', voucherSchema);