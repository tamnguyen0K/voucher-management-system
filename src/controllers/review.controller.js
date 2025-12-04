/**
 * File: controllers/review.controller.js
 * 
 * Mô tả: Controller xử lý các thao tác liên quan đến đánh giá (Review)
 * - Tạo, cập nhật, xóa đánh giá (user)
 * - Quản lý đánh giá (admin, owner)
 * - Lấy số lần đánh giá còn lại của user
 * - Tự động cập nhật rating trung bình của location
 * 
 * Công nghệ sử dụng:
 * - Express.js: Framework web server
 * - Mongoose: ODM cho MongoDB
 * - Multer: Xử lý upload file (ảnh/video)
 * - File System (fs): Quản lý file media
 */

const fs = require('fs');
const path = require('path');
const Review = require('../models/review.model');
const Location = require('../models/location.model');

const MAX_REVIEWS_PER_LOCATION = 3;

const buildMediaPayload = (file, userId) => ({
  type: file.mimetype.startsWith('video/') ? 'video' : 'image',
  url: `/${path.join('uploads', 'reviews', String(userId), file.filename).replace(/\\/g, '/')}`,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size
});

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

const updateLocationRating = async (locationId) => {
  try {
    const reviews = await Review.find({ location: locationId });
    const newRating = reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length) * 10) / 10
      : 0;
    await Location.findByIdAndUpdate(locationId, { rating: newRating });
  } catch (error) {
    console.error('Update location rating error:', error);
    throw error;
  }
};

const validateReviewInput = (rating, comment, locationId, userId) => {
  if (!userId) return { error: 'Vui lòng đăng nhập để đánh giá', redirect: '/auth' };
  if (!locationId) return { error: 'Thiếu thông tin địa điểm', redirect: '/locations' };

  const ratingNum = parseInt(rating);
  if (!rating || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return { error: 'Vui lòng chọn điểm đánh giá từ 1 đến 5 sao', redirect: `/locations/${locationId}` };
  }

  const commentTrimmed = (comment || '').trim();
  if (!commentTrimmed || commentTrimmed.length === 0) {
    return { error: 'Vui lòng nhập nhận xét', redirect: `/locations/${locationId}` };
  }
  if (commentTrimmed.length > 500) {
    return { error: 'Nhận xét không được vượt quá 500 ký tự', redirect: `/locations/${locationId}` };
  }

  return { ratingNum, commentTrimmed };
};

const createReview = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.session.userId;

    const validation = validateReviewInput(rating, comment, locationId, userId);
    if (validation.error) {
      req.flash('error', validation.error);
      return res.redirect(validation.redirect);
    }

    const reviewCount = await Review.countDocuments({ user: userId, location: locationId });
    if (reviewCount >= MAX_REVIEWS_PER_LOCATION) {
      req.flash('error', `Bạn đã đánh giá địa điểm này ${MAX_REVIEWS_PER_LOCATION} lần rồi. Mỗi tài khoản chỉ có thể đánh giá tối đa ${MAX_REVIEWS_PER_LOCATION} lần cho mỗi địa điểm.`);
      return res.redirect(`/locations/${locationId}`);
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : [req.files]) : [];
    const validFiles = files.filter(file => file && file.filename);
    
    if (validFiles.length === 0) {
      req.flash('error', 'Vui lòng chọn ít nhất 1 hình ảnh hoặc video');
      return res.redirect(`/locations/${locationId}`);
    }

    const media = validFiles.map(file => buildMediaPayload(file, userId));
    const review = new Review({
      user: userId,
      location: locationId,
      rating: validation.ratingNum,
      comment: validation.commentTrimmed,
      media
    });

    await review.save();
    await updateLocationRating(locationId);
    req.flash('success', 'Đánh giá thành công!');
    res.redirect(`/locations/${locationId}`);
  } catch (error) {
    console.error('[CreateReview] Error:', error);
    req.flash('error', `Có lỗi xảy ra khi đánh giá: ${error.message || 'Unknown error'}`);
    res.redirect(`/locations/${req.params.locationId || '/'}`);
  }
};

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
    await Promise.all([
      removeReviewMedia(review.media),
      Review.findByIdAndDelete(reviewId)
    ]);
    await updateLocationRating(locationId);

    req.flash('success', 'Xóa đánh giá thành công!');
    res.redirect('/profile');
  } catch (error) {
    console.error('Delete review error:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa đánh giá');
    res.redirect('/profile');
  }
};

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

const adminDeleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    
    if (!review) {
      req.flash('error', 'Không tìm thấy đánh giá');
      return res.redirect('/admin/reviews');
    }

    const locationId = review.location;
    await Promise.all([
      removeReviewMedia(review.media),
      Review.findByIdAndDelete(reviewId)
    ]);
    await updateLocationRating(locationId);

    req.flash('success', 'Xóa đánh giá thành công!');
    res.redirect('/admin/reviews');
  } catch (error) {
    console.error('Admin delete review error:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa đánh giá');
    res.redirect('/admin/reviews');
  }
};

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

const findReviewWithRelations = async (reviewId) => {
  return Review.findById(reviewId)
    .populate('user', 'username email')
    .populate({ path: 'location', select: 'name owner', populate: { path: 'owner', select: 'username' } });
};

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

const getReviewRemainingCount = async (req, res) => {
  try {
    const { locationId } = req.params;
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
    }

    const reviewCount = await Review.countDocuments({ user: userId, location: locationId });
    const remaining = Math.max(0, MAX_REVIEWS_PER_LOCATION - reviewCount);

    return res.json({
      success: true,
      currentCount: reviewCount,
      maxAllowed: MAX_REVIEWS_PER_LOCATION,
      remaining,
      canReview: remaining > 0
    });
  } catch (error) {
    console.error('Get review remaining count error:', error);
    return res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi tải thông tin' });
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
  adminGetReviewDetail,
  getReviewRemainingCount
};
