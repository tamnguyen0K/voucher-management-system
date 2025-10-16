// Import thư viện mongoose để định nghĩa schema và model
const mongoose = require('mongoose');

// Tạo schema cho review (đánh giá)
const reviewSchema = new mongoose.Schema({
  // Người dùng viết review này
  user: {
    type: mongoose.Schema.Types.ObjectId, // Kiểu ObjectId để tham chiếu
    ref: 'User',                          // Liên kết đến model User
    required: [true, 'User is required']  // Bắt buộc phải có người dùng
  },

  // Địa điểm được đánh giá
  location: {
    type: mongoose.Schema.Types.ObjectId, // Tham chiếu đến Location
    ref: 'Location',
    required: [true, 'Location is required']
  },

  // Số điểm đánh giá (từ 1 đến 5 sao)
  rating: {
    type: Number,
    required: [true, 'Rating is required'],   // Bắt buộc phải có
    min: [1, 'Rating must be at least 1'],    // Nhỏ nhất là 1
    max: [5, 'Rating must not exceed 5']      // Lớn nhất là 5
  },

  // Nội dung bình luận của người dùng
  comment: {
    type: String,
    trim: true,                               // Bỏ khoảng trắng thừa
    maxlength: [500, 'Comment cannot exceed 500 characters'] // Giới hạn 500 ký tự
  },

  // Thời gian tạo đánh giá
  createdAt: {
    type: Date,
    default: Date.now                         // Tự động lấy thời gian hiện tại
  }
});


// Tạo **chỉ mục tổng hợp (compound index)** để ngăn việc
// một người dùng đánh giá cùng một địa điểm nhiều lần
reviewSchema.index({ user: 1, location: 1 }, { unique: true });


// Tạo các chỉ mục khác để **tăng tốc truy vấn**
reviewSchema.index({ location: 1 });      // Tìm nhanh tất cả review theo location
reviewSchema.index({ createdAt: -1 });    // Sắp xếp nhanh theo thời gian tạo (mới nhất trước)


// Tạo model Review từ schema và export ra
// MongoDB sẽ lưu trong collection "reviews"
module.exports = mongoose.model('Review', reviewSchema);