/**
 * File: models/location.model.js
 * 
 * Mô tả: Định nghĩa schema và model cho địa điểm (Location)
 * - Quản lý thông tin địa điểm: name, description, address, type, rating
 * - Quản lý metadata: city, priceLevel, priceRange, features, menuHighlights, keywords
 * - Text index để hỗ trợ tìm kiếm full-text
 * - Virtual field để hiển thị rating với 1 chữ số thập phân
 * 
 * Công nghệ sử dụng:
 * - Mongoose: ODM cho MongoDB
 * - Mongoose Virtuals: Tạo trường ảo (averageRating)
 * - MongoDB Text Index: Tìm kiếm full-text trên nhiều trường
 */

const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true,
    maxlength: [100, 'Location name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  type: {
    type: String,
    required: [true, 'Location type is required'],
    enum: ['restaurant', 'cafe', 'tourist_spot'],
    default: 'restaurant'
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot exceed 5']
  },
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/400x300?text=No+Image',
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required']
  },
  city: {
    type: String,
    trim: true,
    default: 'Chưa cập nhật'
  },
  priceLevel: {
    type: String,
    enum: ['budget', 'standard', 'premium'],
    default: 'standard'
  },
  priceRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 }
  },
  features: {
    type: [String],
    default: []
  },
  menuHighlights: {
    type: [String],
    default: []
  },
  keywords: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

locationSchema.virtual('averageRating').get(function() {
  return this.rating.toFixed(1);
});

locationSchema.set('toJSON', { virtuals: true });

locationSchema.index({
  name: 'text',
  description: 'text',
  address: 'text',
  city: 'text',
  keywords: 'text'
});

module.exports = mongoose.model('Location', locationSchema);
