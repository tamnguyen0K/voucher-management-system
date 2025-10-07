const Review = require('../models/review.model');
const Location = require('../models/location.model');

// Create review
const createReview = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.session.userId;

    if (!userId) {
      req.flash('error', 'Vui lòng đăng nhập để đánh giá');
      return res.redirect('/auth');
    }

    // Check if user already reviewed this location
    const existingReview = await Review.findOne({
      user: userId,
      location: locationId
    });

    if (existingReview) {
      req.flash('error', 'Bạn đã đánh giá địa điểm này rồi');
      return res.redirect(`/locations/${locationId}`);
    }

    // Create review
    const review = new Review({
      user: userId,
      location: locationId,
      rating,
      comment
    });

    await review.save();

    // Update location rating
    await updateLocationRating(locationId);

    req.flash('success', 'Đánh giá thành công!');
    res.redirect(`/locations/${locationId}`);
  } catch (error) {
    console.error('Create review error:', error);
    req.flash('error', 'Có lỗi xảy ra khi đánh giá');
    res.redirect('/');
  }
};

// Update review
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.session.userId;

    const review = await Review.findOne({
      _id: reviewId,
      user: userId
    });

    if (!review) {
      req.flash('error', 'Không tìm thấy đánh giá hoặc bạn không có quyền chỉnh sửa');
      return res.redirect('/profile');
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();

    // Update location rating
    await updateLocationRating(review.location);

    req.flash('success', 'Cập nhật đánh giá thành công!');
    res.redirect('/profile');
  } catch (error) {
    console.error('Update review error:', error);
    req.flash('error', 'Có lỗi xảy ra khi cập nhật đánh giá');
    res.redirect('/profile');
  }
};

// Delete review
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.session.userId;

    const review = await Review.findOne({
      _id: reviewId,
      user: userId
    });

    if (!review) {
      req.flash('error', 'Không tìm thấy đánh giá hoặc bạn không có quyền xóa');
      return res.redirect('/profile');
    }

    const locationId = review.location;
    await Review.findByIdAndDelete(reviewId);

    // Update location rating
    await updateLocationRating(locationId);

    req.flash('success', 'Xóa đánh giá thành công!');
    res.redirect('/profile');
  } catch (error) {
    console.error('Delete review error:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa đánh giá');
    res.redirect('/profile');
  }
};

// Get all reviews (for admin)
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'username email')
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    res.render('admin/manage_review', {
      title: 'Quản lý Đánh giá',
      reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải danh sách đánh giá');
    res.redirect('/admin/dashboard');
  }
};

// Delete review (admin only)
const adminDeleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      req.flash('error', 'Không tìm thấy đánh giá');
      return res.redirect('/admin/reviews');
    }

    const locationId = review.location;
    await Review.findByIdAndDelete(reviewId);

    // Update location rating
    await updateLocationRating(locationId);

    req.flash('success', 'Xóa đánh giá thành công!');
    res.redirect('/admin/reviews');
  } catch (error) {
    console.error('Admin delete review error:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa đánh giá');
    res.redirect('/admin/reviews');
  }
};

// Helper function to update location rating
const updateLocationRating = async (locationId) => {
  try {
    const reviews = await Review.find({ location: locationId });
    
    if (reviews.length === 0) {
      await Location.findByIdAndUpdate(locationId, { rating: 0 });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Location.findByIdAndUpdate(locationId, {
      rating: Math.round(averageRating * 10) / 10
    });
  } catch (error) {
    console.error('Update location rating error:', error);
  }
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getAllReviews,
  adminDeleteReview
};
