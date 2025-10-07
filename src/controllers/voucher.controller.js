const Voucher = require('../models/voucher.model');
const Location = require('../models/location.model');

// Get all active vouchers
const getAllVouchers = async (req, res) => {
  try {
    const now = new Date();
    const vouchers = await Voucher.find({
      startDate: { $lte: now },
      endDate: { $gte: now },
      $expr: { $lt: ['$quantityClaimed', '$quantityTotal'] }
    })
      .populate('location', 'name imageUrl type')
      .sort({ createdAt: -1 });

    res.render('pages/voucher_list', {
      title: 'Danh sách Voucher',
      vouchers
    });
  } catch (error) {
    console.error('Get vouchers error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải danh sách voucher');
    res.redirect('/');
  }
};

// Claim voucher
const claimVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const userId = req.session.userId;

    if (!userId) {
      req.flash('error', 'Vui lòng đăng nhập để claim voucher');
      return res.redirect('/auth');
    }

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      req.flash('error', 'Không tìm thấy voucher');
      return res.redirect('/vouchers');
    }

    // Check if voucher is still valid
    const now = new Date();
    if (now < voucher.startDate || now > voucher.endDate) {
      req.flash('error', 'Voucher đã hết hạn');
      return res.redirect('/vouchers');
    }

    if (voucher.quantityClaimed >= voucher.quantityTotal) {
      req.flash('error', 'Voucher đã hết số lượng');
      return res.redirect('/vouchers');
    }

    // Claim voucher
    voucher.quantityClaimed += 1;
    await voucher.save();

    req.flash('success', `Claim voucher ${voucher.code} thành công! Giảm ${voucher.discountPct}%`);
    res.redirect('/vouchers');
  } catch (error) {
    console.error('Claim voucher error:', error);
    req.flash('error', 'Có lỗi xảy ra khi claim voucher');
    res.redirect('/vouchers');
  }
};

// Create voucher (for owners)
const createVoucher = async (req, res) => {
  try {
    const {
      code,
      discountPct,
      quantityTotal,
      startDate,
      endDate,
      locationId,
      conditions
    } = req.body;

    const ownerId = req.session.userId;

    // Check if location belongs to owner
    const location = await Location.findOne({
      _id: locationId,
      owner: ownerId
    });

    if (!location) {
      req.flash('error', 'Không tìm thấy địa điểm hoặc bạn không có quyền tạo voucher');
      return res.redirect('/owner/vouchers');
    }

    // Check if voucher code already exists
    const existingVoucher = await Voucher.findOne({ code });
    if (existingVoucher) {
      req.flash('error', 'Mã voucher đã tồn tại');
      return res.redirect('/owner/vouchers');
    }

    const voucher = new Voucher({
      code: code.toUpperCase(),
      discountPct,
      quantityTotal,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location: locationId,
      conditions
    });

    await voucher.save();
    req.flash('success', 'Tạo voucher thành công!');
    res.redirect('/owner/vouchers');
  } catch (error) {
    console.error('Create voucher error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tạo voucher');
    res.redirect('/owner/vouchers');
  }
};

// Update voucher (for owners)
const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      discountPct,
      quantityTotal,
      startDate,
      endDate,
      conditions
    } = req.body;

    const ownerId = req.session.userId;

    // Find voucher and check ownership through location
    const voucher = await Voucher.findById(id).populate('location');
    if (!voucher || voucher.location.owner.toString() !== ownerId) {
      req.flash('error', 'Không tìm thấy voucher hoặc bạn không có quyền chỉnh sửa');
      return res.redirect('/owner/vouchers');
    }

    voucher.discountPct = discountPct;
    voucher.quantityTotal = quantityTotal;
    voucher.startDate = new Date(startDate);
    voucher.endDate = new Date(endDate);
    voucher.conditions = conditions;

    await voucher.save();
    req.flash('success', 'Cập nhật voucher thành công!');
    res.redirect('/owner/vouchers');
  } catch (error) {
    console.error('Update voucher error:', error);
    req.flash('error', 'Có lỗi xảy ra khi cập nhật voucher');
    res.redirect('/owner/vouchers');
  }
};

// Delete voucher (for owners)
const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.session.userId;

    // Find voucher and check ownership through location
    const voucher = await Voucher.findById(id).populate('location');
    if (!voucher || voucher.location.owner.toString() !== ownerId) {
      req.flash('error', 'Không tìm thấy voucher hoặc bạn không có quyền xóa');
      return res.redirect('/owner/vouchers');
    }

    await Voucher.findByIdAndDelete(id);
    req.flash('success', 'Xóa voucher thành công!');
    res.redirect('/owner/vouchers');
  } catch (error) {
    console.error('Delete voucher error:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa voucher');
    res.redirect('/owner/vouchers');
  }
};

// Get vouchers for owner
const getOwnerVouchers = async (req, res) => {
  try {
    const ownerId = req.session.userId;

    const locations = await Location.find({ owner: ownerId });
    const locationIds = locations.map(loc => loc._id);

    const vouchers = await Voucher.find({
      location: { $in: locationIds }
    })
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    res.render('admin/manage_voucher', {
      title: 'Quản lý Voucher',
      vouchers,
      locations
    });
  } catch (error) {
    console.error('Get owner vouchers error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải danh sách voucher');
    res.redirect('/owner/dashboard');
  }
};

module.exports = {
  getAllVouchers,
  claimVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  getOwnerVouchers
};
