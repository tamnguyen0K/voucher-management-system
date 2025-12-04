/**
 * File: controllers/voucher.controller.js
 * 
 * Mô tả: Controller xử lý các thao tác liên quan đến voucher
 * - Lấy danh sách voucher đang hoạt động
 * - Claim voucher (chỉ user)
 * - Tạo, cập nhật, xóa voucher (owner)
 * - Lấy trạng thái voucher (API)
 * 
 * Công nghệ sử dụng:
 * - Express.js: Framework web server
 * - Mongoose: ODM cho MongoDB
 * - EJS: Template engine để render views
 */

const Voucher = require('../models/voucher.model');
const Location = require('../models/location.model');
const User = require('../models/user.model');

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

const claimVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const userId = req.session.userId;
    const userRole = req.session.userRole;

    if (!userId || userRole !== 'user') {
      req.flash('error', userRole !== 'user' ? 'Chỉ người dùng mới có thể claim voucher' : 'Vui lòng đăng nhập để claim voucher');
      return res.redirect(userRole !== 'user' ? '/vouchers' : '/auth');
    }

    const [user, voucher] = await Promise.all([
      User.findById(userId),
      Voucher.findById(voucherId).populate('location', 'name')
    ]);

    if (!user || !voucher) {
      req.flash('error', !user ? 'Không tìm thấy thông tin người dùng' : 'Không tìm thấy voucher');
      return res.redirect('/vouchers');
    }

    const now = new Date();
    if (now < voucher.startDate || now > voucher.endDate) {
      req.flash('error', 'Voucher đã hết hạn');
      return res.redirect('/vouchers');
    }

    if (voucher.quantityClaimed >= voucher.quantityTotal) {
      req.flash('error', 'Voucher đã hết số lượng');
      return res.redirect('/vouchers');
    }

    const alreadyClaimed = user.claimedVouchers.some(
      v => v.voucherId.toString() === voucherId && new Date(v.expiryDate) > now
    );
    if (alreadyClaimed) {
      req.flash('error', 'Bạn đã claim voucher này rồi');
      return res.redirect('/vouchers');
    }

    user.claimedVouchers.push({
      voucherCode: voucher.code,
      voucherId: voucher._id,
      expiryDate: voucher.endDate,
      locationName: voucher.location.name,
      discountPct: voucher.discountPct
    });

    voucher.quantityClaimed += 1;

    await Promise.all([user.save(), voucher.save()]);
    req.flash('success', `Claim voucher ${voucher.code} thành công! Giảm ${voucher.discountPct}%`);
    res.redirect('/vouchers');
  } catch (error) {
    console.error('Claim voucher error:', error);
    req.flash('error', 'Có lỗi xảy ra khi claim voucher');
    res.redirect('/vouchers');
  }
};

const getVoucherStatus = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const userId = req.session.userId;
    const userRole = req.session.userRole;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'unauthorized' });
    }

    const [voucher, user] = await Promise.all([
      Voucher.findById(voucherId).populate('location', 'name'),
      User.findById(userId).select('claimedVouchers')
    ]);

    if (!voucher) {
      return res.status(404).json({ success: false, error: 'not_found' });
    }

    const now = new Date();
    const status = now < voucher.startDate ? 'upcoming'
      : now > voucher.endDate ? 'expired'
      : voucher.quantityClaimed >= voucher.quantityTotal ? 'soldout'
      : 'active';

    const alreadyClaimed = !!(user && user.claimedVouchers.some(
      v => v.voucherId.toString() === voucherId && new Date(v.expiryDate) > now
    ));

    return res.json({
      success: true,
      eligible: userRole === 'user',
      alreadyClaimed,
      status,
      quantityRemaining: Math.max(0, voucher.quantityTotal - voucher.quantityClaimed),
      quantityTotal: voucher.quantityTotal,
      quantityClaimed: voucher.quantityClaimed,
      code: voucher.code,
      discountPct: voucher.discountPct,
      expiryDate: voucher.endDate,
      locationName: voucher.location ? voucher.location.name : undefined
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'server_error' });
  }
};

const createVoucher = async (req, res) => {
  try {
    const { code, discountPct, quantityTotal, startDate, endDate, locationId, conditions } = req.body;
    const ownerId = req.session.userId;

    const location = await Location.findOne({ _id: locationId, owner: ownerId });
    if (!location) {
      req.flash('error', 'Không tìm thấy địa điểm hoặc bạn không có quyền tạo voucher');
      return res.redirect('/owner/vouchers');
    }

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

const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const { discountPct, quantityTotal, startDate, endDate, conditions } = req.body;
    const ownerId = req.session.userId;

    const voucher = await Voucher.findById(id).populate('location');
    if (!voucher || voucher.location.owner.toString() !== ownerId) {
      req.flash('error', 'Không tìm thấy voucher hoặc bạn không có quyền chỉnh sửa');
      return res.redirect('/owner/vouchers');
    }

    Object.assign(voucher, {
      discountPct,
      quantityTotal,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      conditions
    });

    await voucher.save();
    req.flash('success', 'Cập nhật voucher thành công!');
    res.redirect('/owner/vouchers');
  } catch (error) {
    console.error('Update voucher error:', error);
    req.flash('error', 'Có lỗi xảy ra khi cập nhật voucher');
    res.redirect('/owner/vouchers');
  }
};

const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.session.userId;

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

const getOwnerVouchers = async (req, res) => {
  try {
    const ownerId = req.session.userId;
    const locations = await Location.find({ owner: ownerId });
    const locationIds = locations.map(loc => loc._id);

    const vouchers = await Voucher.find({ location: { $in: locationIds } })
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    res.render('admin/manage_voucher', {
      title: 'Quản lý Voucher',
      vouchers,
      locations,
      isAdmin: false
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
  getOwnerVouchers,
  getVoucherStatus
};
