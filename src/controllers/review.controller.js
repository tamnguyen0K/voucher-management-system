// Import model Review và Location để thao tác với cơ sở dữ liệu MongoDB
const Review = require('../models/review.model');
const Location = require('../models/location.model');

// ==========================
// Hàm tạo đánh giá mới
// ==========================
const createReview = async (req, res) => {
  try {
    const { locationId } = req.params;      // Lấy ID của địa điểm từ URL (vd: /locations/:locationId)
    const { rating, comment } = req.body;   // Lấy điểm đánh giá và bình luận người dùng nhập
    const userId = req.session.userId;      // Lấy ID người dùng từ session (đã đăng nhập)

    // Nếu chưa đăng nhập → báo lỗi và yêu cầu đăng nhập
    if (!userId) {
      req.flash('error', 'Vui lòng đăng nhập để đánh giá');
      return res.redirect('/auth');
    }

    // Kiểm tra người dùng đã từng đánh giá địa điểm này chưa
    const existingReview = await Review.findOne({
      user: userId,
      location: locationId
    });

    // Nếu đã đánh giá rồi → không cho đánh giá lại
    if (existingReview) {
      req.flash('error', 'Bạn đã đánh giá địa điểm này rồi');
      return res.redirect(`/locations/${locationId}`);
    }

    // Tạo đối tượng đánh giá mới
    const review = new Review({
      user: userId,
      location: locationId,
      rating,
      comment
    });

    // Lưu đánh giá vào cơ sở dữ liệu
    await review.save();

    // Cập nhật lại điểm trung bình của địa điểm
    await updateLocationRating(locationId);

    req.flash('success', 'Đánh giá thành công!');
    res.redirect(`/locations/${locationId}`);
  } catch (error) {
    console.error('Create review error:', error);
    req.flash('error', 'Có lỗi xảy ra khi đánh giá');
    res.redirect('/');
  }
};

// ==========================
// Hàm cập nhật đánh giá
// ==========================
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;       // Lấy ID đánh giá cần sửa
    const { rating, comment } = req.body;  // Lấy dữ liệu người dùng sửa
    const userId = req.session.userId;     // Lấy ID người dùng hiện tại

    // Tìm đánh giá thuộc về người dùng hiện tại
    const review = await Review.findOne({
      _id: reviewId,
      user: userId
    });

    // Nếu không tìm thấy → báo lỗi
    if (!review) {
      req.flash('error', 'Không tìm thấy đánh giá hoặc bạn không có quyền chỉnh sửa');
      return res.redirect('/profile');
    }

    // Cập nhật nội dung đánh giá
    review.rating = rating;
    review.comment = comment;
    await review.save();

    // Cập nhật lại điểm trung bình cho địa điểm đó
    await updateLocationRating(review.location);

    req.flash('success', 'Cập nhật đánh giá thành công!');
    res.redirect('/profile');
  } catch (error) {
    console.error('Update review error:', error);
    req.flash('error', 'Có lỗi xảy ra khi cập nhật đánh giá');
    res.redirect('/profile');
  }
};

// ==========================
// Hàm xóa đánh giá (người dùng)
// ==========================
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;    // Lấy ID đánh giá
    const userId = req.session.userId;  // Lấy ID người dùng

    // Kiểm tra xem đánh giá có tồn tại và thuộc về người dùng này không
    const review = await Review.findOne({
      _id: reviewId,
      user: userId
    });

    // Nếu không hợp lệ → không cho xóa
    if (!review) {
      req.flash('error', 'Không tìm thấy đánh giá hoặc bạn không có quyền xóa');
      return res.redirect('/profile');
    }

    const locationId = review.location;  // Lưu lại ID địa điểm
    await Review.findByIdAndDelete(reviewId); // Xóa đánh giá khỏi DB

    // Cập nhật lại điểm trung bình của địa điểm
    await updateLocationRating(locationId);

    req.flash('success', 'Xóa đánh giá thành công!');
    res.redirect('/profile');
  } catch (error) {
    console.error('Delete review error:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa đánh giá');
    res.redirect('/profile');
  }
};

// ==========================
// Hàm lấy tất cả đánh giá (dành cho Admin)
// ==========================
const getAllReviews = async (req, res) => {
  try {
    // Lấy tất cả đánh giá, kèm thông tin user và địa điểm
    const reviews = await Review.find()
      .populate('user', 'username email')   // Lấy thêm thông tin người dùng (chỉ username và email)
      .populate('location', 'name')         // Lấy tên địa điểm
      .sort({ createdAt: -1 });             // Sắp xếp theo thời gian mới nhất

    // Render ra trang admin
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

// ==========================
// Hàm xóa đánh giá (Admin)
// ==========================
const adminDeleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;   // Lấy ID đánh giá cần xóa

    const review = await Review.findById(reviewId);
    if (!review) {
      req.flash('error', 'Không tìm thấy đánh giá');
      return res.redirect('/admin/reviews');
    }

    const locationId = review.location;
    await Review.findByIdAndDelete(reviewId);

    // Sau khi xóa → cập nhật lại điểm trung bình
    await updateLocationRating(locationId);

    req.flash('success', 'Xóa đánh giá thành công!');
    res.redirect('/admin/reviews');
  } catch (error) {
    console.error('Admin delete review error:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa đánh giá');
    res.redirect('/admin/reviews');
  }
};

// ==========================
// Hàm phụ: Cập nhật điểm trung bình của địa điểm
// ==========================
const updateLocationRating = async (locationId) => {
  try {
    // Lấy tất cả các review của địa điểm
    const reviews = await Review.find({ location: locationId });
    
    // Nếu không có review nào → đặt rating = 0
    if (reviews.length === 0) {
      await Location.findByIdAndUpdate(locationId, { rating: 0 });
      return;
    }

    // Tính tổng và trung bình rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Cập nhật rating trung bình (làm tròn 1 chữ số thập phân)
    await Location.findByIdAndUpdate(locationId, {
      rating: Math.round(averageRating * 10) / 10
    });
  } catch (error) {
    console.error('Update location rating error:', error);
  }
};

// ==========================
// Xuất module để sử dụng bên ngoài
// ==========================
module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getAllReviews,
  adminDeleteReview
};