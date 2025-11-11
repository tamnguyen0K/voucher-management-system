/**
 * File: controllers/review.controller.js
 * Mô tả: Xử lý logic tạo, sửa, xóa và quản lý đánh giá (review)
 */

const fs = require('fs');
const path = require('path');
const Review = require('../models/review.model');
const Location = require('../models/location.model');

const buildMediaPayload = (file, userId) => {
  const type = file.mimetype.startsWith('video/') ? 'video' : 'image';
  const relativeUrl = path.join('uploads', 'reviews', String(userId), file.filename).replace(/\\/g, '/');
  return {
    type,
    url: `/${relativeUrl}`,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size
  };
};

const removeReviewMedia = async (media = []) => {
  await Promise.all(media.map(async (item) => {
    if (!item?.url) return;
    try {
      const absolutePath = path.join(__dirname, '..', item.url.replace(/^\//, ''));
      await fs.promises.unlink(absolutePath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('Không thể xóa tệp media của review:', error.message);
      }
    }
  }));
};

/**
 * Hàm: createReview
 * Mô tả: Tạo đánh giá mới
 */
const createReview = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.session.userId;
    const files = Array.isArray(req.files) ? req.files : [];

    if (!userId) {
      req.flash('error', 'Vui lòng đăng nhập để đánh giá');
      return res.redirect('/auth');
    }

    const existingReview = await Review.findOne({ user: userId, location: locationId });
    if (existingReview) {
      req.flash('error', 'Bạn đã đánh giá địa điểm này rồi');
      return res.redirect(`/locations/${locationId}`);
    }

    const media = files.map(file => buildMediaPayload(file, userId));

    const review = new Review({ user: userId, location: locationId, rating, comment, media });
    await review.save();
    await updateLocationRating(locationId);

    req.flash('success', 'Đánh giá thành công!');
    res.redirect(`/locations/${locationId}`);
  } catch (error) {
    console.error('Create review error:', error);
    req.flash('error', 'Có lỗi xảy ra khi đánh giá');
    res.redirect('/');
  }
};

/**
 * Hàm: updateReview
 * Mô tả: Cập nhật đánh giá
 */
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.session.userId;
    const files = Array.isArray(req.files) ? req.files : [];

    const review = await Review.findOne({ _id: reviewId, user: userId });
    if (!review) {
      req.flash('error', 'Không tìm thấy đánh giá hoặc bạn không có quyền chỉnh sửa');
      return res.redirect('/profile');
    }

    review.rating = rating;
    review.comment = comment;

    if (files.length) {
      const media = files.map(file => buildMediaPayload(file, userId));
      review.media = [...(review.media || []), ...media];
    }

    await review.save();
    await updateLocationRating(review.location);

    req.flash('success', 'Cập nhật đánh giá thành công!');
    res.redirect('/profile');
  } catch (error) {
    console.error('Update review error:', error);
    req.flash('error', 'Có lỗi xảy ra khi cập nhật đánh giá');
    res.redirect('/profile');
  }
};

/**
 * Hàm: deleteReview
 * Mô tả: Xóa đánh giá (người dùng)
 */
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.session.userId;

    const review = await Review.findOne({ _id: reviewId, user: userId });
    if (!review) {
      req.flash('error', 'Không tìm thấy đánh giá hoặc bạn không có quyền xóa');
      return res.redirect('/profile');
    }

    const locationId = review.location;
    await removeReviewMedia(review.media);
    await Review.findByIdAndDelete(reviewId);
    await updateLocationRating(locationId);

    req.flash('success', 'Xóa đánh giá thành công!');
    res.redirect('/profile');
  } catch (error) {
    console.error('Delete review error:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa đánh giá');
    res.redirect('/profile');
  }
};

/**
 * Hàm: getAllReviews
 * Mô tả: Lấy tất cả đánh giá (Admin)
 */
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

/**
 * Hàm: adminDeleteReview
 * Mô tả: Xóa đánh giá (Admin)
 */
const adminDeleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      req.flash('error', 'Không tìm thấy đánh giá');
      return res.redirect('/admin/reviews');
    }

    const locationId = review.location;
    await removeReviewMedia(review.media);
    await Review.findByIdAndDelete(reviewId);
    await updateLocationRating(locationId);

    req.flash('success', 'Xóa đánh giá thành công!');
    res.redirect('/admin/reviews');
  } catch (error) {
    console.error('Admin delete review error:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa đánh giá');
    res.redirect('/admin/reviews');
  }
};

/**
 * Hàm: updateLocationRating
 * Mô tả: Cập nhật điểm trung bình của địa điểm dựa trên các đánh giá
 */
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

/**
 * Hàm: getOwnerReviews
 * Mô tả: Chủ sở hữu xem tất cả đánh giá của các địa điểm thuộc quyền sở hữu
 */
const getOwnerReviews = async (req, res) => {
  try {
    const ownerId = req.session.userId;
    if (!ownerId || req.session.userRole !== 'owner') {
      req.flash('error', 'Bạn không có quyền truy cập');
      return res.redirect('/');
    }

    const locationIds = await Location.find({ owner: ownerId }).distinct('_id');

    const reviews = await Review.find({ location: { $in: locationIds } })
      .populate('user', 'username email')
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    res.render('owner/manage_review', {
      title: 'Đánh giá địa điểm của tôi',
      reviews
    });
  } catch (error) {
    console.error('Get owner reviews error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải danh sách đánh giá');
    res.redirect('/owner/dashboard');
  }
};

/**
 * Helper: Lấy chi tiết một đánh giá theo ID, kèm user và location(owner)
 */
const findReviewWithRelations = async (reviewId) => {
  return Review.findById(reviewId)
    .populate('user', 'username email')
    .populate({ path: 'location', select: 'name owner', populate: { path: 'owner', select: 'username' } });
};

/**
 * Hàm: ownerGetReviewDetail
 * Mô tả: Chủ sở hữu xem chi tiết đánh giá (chỉ những đánh giá thuộc địa điểm của mình)
 */
const ownerGetReviewDetail = async (req, res) => {
  try {
    const ownerId = req.session.userId;
    if (!ownerId || req.session.userRole !== 'owner') {
      req.flash('error', 'Bạn không có quyền truy cập');
      return res.redirect('/');
    }

    const { reviewId } = req.params;
    const review = await findReviewWithRelations(reviewId);

    if (!review) {
      req.flash('error', 'Không tìm thấy đánh giá');
      return res.redirect('/owner/reviews');
    }

    if (String(review.location?.owner) !== String(ownerId)) {
      req.flash('error', 'Bạn không có quyền xem đánh giá này');
      return res.redirect('/owner/reviews');
    }

    res.render('owner/review_detail', {
      title: 'Chi tiết đánh giá',
      review
    });
  } catch (error) {
    console.error('Owner review detail error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải chi tiết đánh giá');
    res.redirect('/owner/reviews');
  }
};

/**
 * Hàm: adminGetReviewDetail
 * Mô tả: Admin xem chi tiết đánh giá
 */
const adminGetReviewDetail = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await findReviewWithRelations(reviewId);

    if (!review) {
      req.flash('error', 'Không tìm thấy đánh giá');
      return res.redirect('/admin/reviews');
    }

    res.render('admin/review_detail', {
      title: 'Chi tiết đánh giá',
      review
    });
  } catch (error) {
    console.error('Admin review detail error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải chi tiết đánh giá');
    res.redirect('/admin/reviews');
  }
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getAllReviews,
  adminDeleteReview,
  getOwnerReviews,
  ownerGetReviewDetail,
  adminGetReviewDetail
};



