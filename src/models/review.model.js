/**
 * File: models/review.model.js
 * 
 * Mô tả: Định nghĩa schema và model cho đánh giá (Review)
 * - Quản lý đánh giá của user cho location: rating, comment, media
 * - Media có thể là ảnh hoặc video
 * - Cho phép mỗi user đánh giá tối đa 3 lần cho mỗi location (giới hạn được kiểm tra trong controller)
 * - Index để tối ưu truy vấn theo user, location và thời gian tạo
 * 
 * Công nghệ sử dụng:
 * - Mongoose: ODM cho MongoDB
 * - MongoDB Indexes: Composite index (user, location) và single indexes để tối ưu query
 * - Mongoose Schema Types: ObjectId references, nested schemas cho media
 */

const mongoose = require('mongoose');

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
    type: [{
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
    }],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

reviewSchema.index({ user: 1, location: 1 });
reviewSchema.index({ location: 1 });
reviewSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
