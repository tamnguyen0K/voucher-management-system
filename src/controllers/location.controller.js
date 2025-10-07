const Location = require('../models/location.model');
const Review = require('../models/review.model');
const Voucher = require('../models/voucher.model');

// Get all locations
const getAllLocations = async (req, res) => {
  try {
    const { type } = req.query;
    let query = {};
    
    if (type && type !== 'all') {
      query.type = type;
    }

    const locations = await Location.find(query)
      .populate('owner', 'username')
      .sort({ createdAt: -1 });

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

// Get location by ID
const getLocationById = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await Location.findById(id).populate('owner', 'username');
    if (!location) {
      req.flash('error', 'Không tìm thấy địa điểm');
      return res.redirect('/locations');
    }

    // Get reviews for this location
    const reviews = await Review.find({ location: id })
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    // Get active vouchers for this location
    const vouchers = await Voucher.find({
      location: id,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      quantityClaimed: { $lt: { $expr: '$quantityTotal' } }
    }).sort({ createdAt: -1 });

    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = (totalRating / reviews.length).toFixed(1);
    }

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

// Create location (for owners)
const createLocation = async (req, res) => {
  try {
    const { name, description, address, type, imageUrl } = req.body;
    const ownerId = req.session.userId;

    const location = new Location({
      name,
      description,
      address,
      type,
      imageUrl: imageUrl || 'https://via.placeholder.com/400x300?text=No+Image',
      owner: ownerId
    });

    await location.save();
    req.flash('success', 'Tạo địa điểm thành công!');
    res.redirect('/owner/locations');
  } catch (error) {
    console.error('Create location error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tạo địa điểm');
    res.redirect('/owner/locations');
  }
};

// Update location (for owners)
const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, address, type, imageUrl } = req.body;
    const ownerId = req.session.userId;

    const location = await Location.findOne({
      _id: id,
      owner: ownerId
    });

    if (!location) {
      req.flash('error', 'Không tìm thấy địa điểm hoặc bạn không có quyền chỉnh sửa');
      return res.redirect('/owner/locations');
    }

    location.name = name;
    location.description = description;
    location.address = address;
    location.type = type;
    if (imageUrl) location.imageUrl = imageUrl;

    await location.save();
    req.flash('success', 'Cập nhật địa điểm thành công!');
    res.redirect('/owner/locations');
  } catch (error) {
    console.error('Update location error:', error);
    req.flash('error', 'Có lỗi xảy ra khi cập nhật địa điểm');
    res.redirect('/owner/locations');
  }
};

// Delete location (for owners)
const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.session.userId;

    const location = await Location.findOne({
      _id: id,
      owner: ownerId
    });

    if (!location) {
      req.flash('error', 'Không tìm thấy địa điểm hoặc bạn không có quyền xóa');
      return res.redirect('/owner/locations');
    }

    // Delete related vouchers and reviews
    await Voucher.deleteMany({ location: id });
    await Review.deleteMany({ location: id });
    await Location.findByIdAndDelete(id);

    req.flash('success', 'Xóa địa điểm thành công!');
    res.redirect('/owner/locations');
  } catch (error) {
    console.error('Delete location error:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa địa điểm');
    res.redirect('/owner/locations');
  }
};

module.exports = {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation
};
