/**
 * Controller xử lý các chức năng liên quan đến địa điểm (locations)
 * Bao gồm: lấy danh sách, chi tiết, tạo, cập nhật và xóa địa điểm
 */

// Import các model cần thiết
const Location = require('../models/location.model');
const Review = require('../models/review.model');
const Voucher = require('../models/voucher.model');

/**
 * Lấy danh sách tất cả địa điểm
 * Có thể lọc theo loại địa điểm từ query parameter 'type'
 * Hiển thị trang danh sách địa điểm với thông tin chủ sở hữu
 */
const getAllLocations = async (req, res) => {
  try {
    // Lấy tham số type từ query string
    const { type } = req.query;
    let query = {};

    // Nếu có type và không phải 'all', thêm điều kiện lọc
    if (type && type !== 'all') {
      query.type = type;
    }

    // Tìm kiếm địa điểm theo query, populate thông tin owner và sắp xếp theo thời gian tạo giảm dần
    const locations = await Location.find(query)
      .populate('owner', 'username')
      .sort({ createdAt: -1 });

    // Render trang locations với dữ liệu
    res.render('pages/locations', {
      title: 'Danh sách địa điểm',
      locations,
      currentType: type || 'all'
    });
  } catch (error) {
    console.error('Get locations error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải danh sách địa điểm');
    res.redirect('/');
  }
};

/**
 * Lấy thông tin chi tiết của một địa điểm theo ID
 * Bao gồm: thông tin địa điểm, danh sách đánh giá, voucher đang hoạt động và điểm đánh giá trung bình
 */
const getLocationById = async (req, res) => {
  try {
    // Lấy ID địa điểm từ tham số URL
    const { id } = req.params;

    // Tìm địa điểm theo ID và populate thông tin chủ sở hữu
    const location = await Location.findById(id).populate('owner', 'username');
    if (!location) {
      req.flash('error', 'Không tìm thấy địa điểm');
      return res.redirect('/locations');
    }

    // Lấy danh sách đánh giá cho địa điểm này, populate thông tin người dùng và sắp xếp theo thời gian giảm dần
    const reviews = await Review.find({ location: id })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    // Lấy danh sách voucher đang hoạt động (trong khoảng thời gian và chưa hết lượt nhận)
    const vouchers = await Voucher.find({
      location: id,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      quantityClaimed: { $lt: { $expr: '$quantityTotal' } }
    }).sort({ createdAt: -1 });

    // Tính điểm đánh giá trung bình
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = (totalRating / reviews.length).toFixed(1);
    }

    // Render trang chi tiết địa điểm với tất cả dữ liệu
    res.render('pages/location_detail', {
      title: location.name,
      location,
      reviews,
      vouchers,
      averageRating,
      reviewCount: reviews.length
    });
  } catch (error) {
    console.error('Get location error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải thông tin địa điểm');
    res.redirect('/locations');
  }
};

/**
 * Tạo mới một địa điểm (chỉ dành cho chủ sở hữu)
 * Nhận dữ liệu từ form và lưu vào database
 */
const createLocation = async (req, res) => {
  try {
    // Lấy dữ liệu từ body của request
    const { name, description, address, type, imageUrl } = req.body;
    // Lấy ID chủ sở hữu từ session
    const ownerId = req.session.userId;

    // Tạo instance mới của Location với dữ liệu nhận được
    const location = new Location({
      name,
      description,
      address,
      type,
      imageUrl: imageUrl || 'https://via.placeholder.com/400x300?text=No+Image',
      owner: ownerId
    });

    // Lưu địa điểm vào database
    await location.save();
    req.flash('success', 'Tạo địa điểm thành công!');
    res.redirect('/owner/locations');
  } catch (error) {
    console.error('Create location error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tạo địa điểm');
    res.redirect('/owner/locations');
  }
};

/**
 * Cập nhật thông tin địa điểm (chỉ dành cho chủ sở hữu)
 * Kiểm tra quyền sở hữu trước khi cho phép cập nhật
 */
const updateLocation = async (req, res) => {
  try {
    // Lấy ID địa điểm từ tham số URL
    const { id } = req.params;
    // Lấy dữ liệu cập nhật từ body
    const { name, description, address, type, imageUrl } = req.body;
    // Lấy ID chủ sở hữu từ session
    const ownerId = req.session.userId;

    // Tìm địa điểm theo ID và kiểm tra chủ sở hữu
    const location = await Location.findOne({
      _id: id,
      owner: ownerId
    });

    if (!location) {
      req.flash('error', 'Không tìm thấy địa điểm hoặc bạn không có quyền chỉnh sửa');
      return res.redirect('/owner/locations');
    }

    // Cập nhật các trường thông tin
    location.name = name;
    location.description = description;
    location.address = address;
    location.type = type;
    if (imageUrl) location.imageUrl = imageUrl;

    // Lưu thay đổi vào database
    await location.save();
    req.flash('success', 'Cập nhật địa điểm thành công!');
    res.redirect('/owner/locations');
  } catch (error) {
    console.error('Update location error:', error);
    req.flash('error', 'Có lỗi xảy ra khi cập nhật địa điểm');
    res.redirect('/owner/locations');
  }
};

/**
 * Xóa địa điểm (chỉ dành cho chủ sở hữu)
 * Đồng thời xóa tất cả voucher và đánh giá liên quan đến địa điểm này
 */
const deleteLocation = async (req, res) => {
  try {
    // Lấy ID địa điểm từ tham số URL
    const { id } = req.params;
    // Lấy ID chủ sở hữu từ session
    const ownerId = req.session.userId;

    // Tìm địa điểm theo ID và kiểm tra chủ sở hữu
    const location = await Location.findOne({
      _id: id,
      owner: ownerId
    });

    if (!location) {
      req.flash('error', 'Không tìm thấy địa điểm hoặc bạn không có quyền xóa');
      return res.redirect('/owner/locations');
    }

    // Xóa tất cả voucher liên quan đến địa điểm
    await Voucher.deleteMany({ location: id });
    // Xóa tất cả đánh giá liên quan đến địa điểm
    await Review.deleteMany({ location: id });
    // Xóa địa điểm
    await Location.findByIdAndDelete(id);

    req.flash('success', 'Xóa địa điểm thành công!');
    res.redirect('/owner/locations');
  } catch (error) {
    console.error('Delete location error:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa địa điểm');
    res.redirect('/owner/locations');
  }
};

/**
 * Xuất các hàm controller để sử dụng trong routes
 */
module.exports = {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation
};
