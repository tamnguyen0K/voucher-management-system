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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for average rating calculation
locationSchema.virtual('averageRating').get(function() {
  return this.rating.toFixed(1);
});

// Ensure virtual fields are serialized
locationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Location', locationSchema);
