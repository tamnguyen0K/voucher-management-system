/**
 * File: routes/admin.routes.js
 * Mô tả: Định nghĩa các routes dành cho admin: dashboard, quản lý users, locations, vouchers, reviews
 */

const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Location = require('../models/location.model');
const Voucher = require('../models/voucher.model');
const Review = require('../models/review.model');
const reviewController = require('../controllers/review.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');

/**
 * Helper: Kiểm tra request có yêu cầu JSON response không
 */
const wantsJson = (req) => {
  return req.xhr ||
    (req.headers['accept'] && req.headers['accept'].includes('application/json')) ||
    (req.headers['content-type'] && req.headers['content-type'].includes('application/json'));
};

/**
 * Route: GET /admin/dashboard
 * Mô tả: Hiển thị dashboard admin với thống kê và biểu đồ tăng trưởng
 */
router.get('/admin/dashboard', requireAuth, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalLocations = await Location.countDocuments();
    const totalVouchers = await Voucher.countDocuments();
    const totalReviews = await Review.countDocuments();

    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
    const recentLocations = await Location.find()
      .populate('owner', 'username')
      .sort({ createdAt: -1 })
      .limit(5);
    const recentVouchers = await Voucher.find()
      .populate('location', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const activeVouchersAgg = await Voucher.aggregate([
      {
        $match: {
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() },
          $expr: { $lt: ['$quantityClaimed', '$quantityTotal'] }
        }
      },
      { $count: 'count' }
    ]);

    const activeVouchers = activeVouchersAgg[0]?.count || 0;
    const expiredVouchers = await Voucher.countDocuments({
      endDate: { $lt: new Date() }
    });

    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() });
    }

    const firstMonth = months[0];
    const startOfRange = new Date(firstMonth.year, firstMonth.month, 1);

    async function monthCounts(Model) {
      const pipeline = [
        { $match: { createdAt: { $gte: startOfRange } } },
        {
          $group: {
            _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
            count: { $sum: 1 }
          }
        }
      ];
      const results = await Model.aggregate(pipeline);
      const map = new Map(results.map(r => [`${r._id.y}-${r._id.m}`, r.count]));
      return months.map(({ year, month }) => map.get(`${year}-${month + 1}`) || 0);
    }

    const [userGrowthCounts, locationGrowthCounts] = await Promise.all([
      monthCounts(User),
      monthCounts(Location)
    ]);

    const monthLabels = months.map(({ year, month }) => {
      const d = new Date(year, month, 1);
      return `${d.toLocaleString('vi-VN', { month: 'short' })} ${String(year).slice(-2)}`;
    });

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats: {
        totalUsers,
        totalLocations,
        totalVouchers,
        totalReviews,
        activeVouchers,
        expiredVouchers
      },
      growthData: {
        labels: monthLabels,
        users: userGrowthCounts,
        locations: locationGrowthCounts
      },
      recentUsers,
      recentLocations,
      recentVouchers
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải dashboard');
    res.redirect('/');
  }
});

/**
 * Route: GET /admin/users
 * Mô tả: Hiển thị trang quản lý người dùng
 */
router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.render('admin/manage_users', {
      title: 'Quản lý Người dùng',
      users,
      userId: req.session.userId.toString()
    });
  } catch (error) {
    console.error('Get users error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải danh sách người dùng');
    res.redirect('/admin/dashboard');
  }
});

/**
 * Route: PUT /admin/users/:id/role
 * Mô tả: Cập nhật vai trò (role) của người dùng
 */
router.put('/admin/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'owner', 'admin'].includes(role)) {
      if (wantsJson(req)) {
        return res.status(400).json({ success: false, message: 'Role không hợp lệ' });
      }
      req.flash('error', 'Role không hợp lệ');
      return res.redirect('/admin/users');
    }

    await User.findByIdAndUpdate(id, { role });

    if (wantsJson(req)) return res.json({ success: true });

    req.flash('success', 'Cập nhật role thành công!');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Update user role error:', error);
    if (wantsJson(req)) {
      return res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi cập nhật role' });
    }
    req.flash('error', 'Có lỗi xảy ra khi cập nhật role');
    res.redirect('/admin/users');
  }
});

/**
 * Route: DELETE /admin/users/:id
 * Mô tả: Xóa người dùng và tất cả dữ liệu liên quan
 */
router.delete('/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (id === String(req.session.userId)) {
      if (wantsJson(req)) {
        return res.status(400).json({ success: false, message: 'Không thể xóa chính mình' });
      }
      req.flash('error', 'Không thể xóa chính mình');
      return res.redirect('/admin/users');
    }

    await Review.deleteMany({ user: id });
    await Location.deleteMany({ owner: id });
    await Voucher.deleteMany({ location: { $in: await Location.find({ owner: id }).distinct('_id') } });
    await User.findByIdAndDelete(id);

    if (wantsJson(req)) return res.json({ success: true });

    req.flash('success', 'Xóa người dùng thành công!');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Delete user error:', error);
    if (wantsJson(req)) {
      return res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi xóa người dùng' });
    }
    req.flash('error', 'Có lỗi xảy ra khi xóa người dùng');
    res.redirect('/admin/users');
  }
});

/**
 * Route: GET /admin/locations
 * Mô tả: Hiển thị trang quản lý địa điểm
 */
router.get('/admin/locations', requireAuth, requireAdmin, async (req, res) => {
  try {
    const locations = await Location.find()
      .populate('owner', 'username email')
      .sort({ createdAt: -1 });

    res.render('admin/manage_location', {
      title: 'Quản lý Địa điểm',
      locations
    });
  } catch (error) {
    console.error('Get locations error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải danh sách địa điểm');
    res.redirect('/admin/dashboard');
  }
});

/**
 * Route: DELETE /admin/locations/:id
 * Mô tả: Xóa địa điểm và tất cả voucher, review liên quan
 */
router.delete('/admin/locations/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Voucher.deleteMany({ location: id });
    await Review.deleteMany({ location: id });
    await Location.findByIdAndDelete(id);

    req.flash('success', 'Xóa địa điểm thành công!');
    res.redirect('/admin/locations');
  } catch (error) {
    console.error('Delete location error:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa địa điểm');
    res.redirect('/admin/locations');
  }
});

/**
 * Route: GET /admin/vouchers
 * Mô tả: Hiển thị trang quản lý voucher
 */
router.get('/admin/vouchers', requireAuth, requireAdmin, async (req, res) => {
  try {
    const vouchers = await Voucher.find()
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    res.render('admin/manage_voucher', {
      title: 'Quản lý Voucher',
      vouchers,
      isAdmin: true
    });
  } catch (error) {
    console.error('Get vouchers error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải danh sách voucher');
    res.redirect('/admin/dashboard');
  }
});

/**
 * Route: DELETE /admin/vouchers/:id
 * Mô tả: Xóa voucher
 */
router.delete('/admin/vouchers/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Voucher.findByIdAndDelete(id);
    req.flash('success', 'Xóa voucher thành công!');
    res.redirect('/admin/vouchers');
  } catch (error) {
    console.error('Delete voucher error:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa voucher');
    res.redirect('/admin/vouchers');
  }
});

router.get('/admin/reviews', requireAuth, requireAdmin, reviewController.getAllReviews);
router.delete('/admin/reviews/:reviewId', requireAuth, requireAdmin, reviewController.adminDeleteReview);

module.exports = router;
