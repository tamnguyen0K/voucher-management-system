// ==================================
// File: models/review.model.js
// Mục đích: Định nghĩa schema và model cho đánh giá (Review)
// ==================================

const mongoose = require('mongoose');

// Định nghĩa schema cho đánh giá
const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: [true, 'Location is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating must not exceed 5']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  media: {
    type: [
      {
        type: {
          type: String,
          enum: ['image', 'video'],
          required: true
        },
        url: {
          type: String,
          required: true
        },
        filename: String,
        mimetype: String,
        size: Number
      }
    ],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ngăn người dùng đánh giá cùng một địa điểm nhiều lần
reviewSchema.index({ user: 1, location: 1 }, { unique: true });

// Tạo chỉ mục để tăng tốc truy vấn và sắp xếp
reviewSchema.index({ location: 1 });
reviewSchema.index({ createdAt: -1 });

// Xuất model Review (tương ứng với collection "reviews")
module.exports = mongoose.model('Review', reviewSchema);
