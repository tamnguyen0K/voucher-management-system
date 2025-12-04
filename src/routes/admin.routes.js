/**
 * File: routes/admin.routes.js
 * 
 * Mô tả: Định nghĩa các routes dành cho admin
 * - Dashboard với thống kê và biểu đồ tăng trưởng
 * - Quản lý users: xem, cập nhật role, xóa
 * - Quản lý locations: xem, xóa
 * - Quản lý vouchers: xem, xóa
 * - Quản lý reviews: xem, xem chi tiết, xóa
 * 
 * Công nghệ sử dụng:
 * - Express.js Router: Định nghĩa routes
 * - Middleware requireAuth, requireAdmin: Xác thực quyền admin
 * - Mongoose Aggregation: Tính toán thống kê và tăng trưởng
 * - MongoDB Text Search: Tìm kiếm và lọc dữ liệu
 */

const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Location = require('../models/location.model');
const Voucher = require('../models/voucher.model');
const Review = require('../models/review.model');
const reviewController = require('../controllers/review.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const wantsJson = (req) => {
  return req.xhr || 
    (req.headers['accept']?.includes('application/json')) ||
    (req.headers['content-type']?.includes('application/json'));
};

const sendResponse = (req, res, success, message, redirectUrl) => {
  if (wantsJson(req)) {
    return res.status(success ? 200 : 400).json({ success, message });
  }
  if (success) req.flash('success', message);
  else req.flash('error', message);
  res.redirect(redirectUrl);
};

const getMonthRange = (monthsBack = 5) => {
  const now = new Date();
  const months = [];
  for (let i = monthsBack; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return months;
};

const getMonthCounts = async (Model, startDate, months) => {
  const pipeline = [
    { $match: { createdAt: { $gte: startDate } } },
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
};

router.get('/admin/dashboard', requireAuth, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const months = getMonthRange(5);
    const startOfRange = new Date(months[0].year, months[0].month, 1);

    const [
      totalUsers,
      totalLocations,
      totalVouchers,
      totalReviews,
      activeVouchersAgg,
      expiredVouchers,
      recentUsers,
      recentLocations,
      recentVouchers,
      monthCountsMap
    ] = await Promise.all([
      User.countDocuments(),
      Location.countDocuments(),
      Voucher.countDocuments(),
      Review.countDocuments(),
      Voucher.aggregate([
        {
          $match: {
            startDate: { $lte: now },
            endDate: { $gte: now },
            $expr: { $lt: ['$quantityClaimed', '$quantityTotal'] }
          }
        },
        { $count: 'count' }
      ]),
      Voucher.countDocuments({ endDate: { $lt: now } }),
      User.find().sort({ createdAt: -1 }).limit(5),
      Location.find().populate('owner', 'username').sort({ createdAt: -1 }).limit(5),
      Voucher.find().populate('location', 'name').sort({ createdAt: -1 }).limit(5),
      Promise.all([getMonthCounts(User, startOfRange, months), getMonthCounts(Location, startOfRange, months)])
    ]);

    const [userGrowthCounts, locationGrowthCounts] = monthCountsMap;
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
        activeVouchers: activeVouchersAgg[0]?.count || 0,
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

router.put('/admin/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'owner', 'admin'].includes(role)) {
      return sendResponse(req, res, false, 'Role không hợp lệ', '/admin/users');
    }

    await User.findByIdAndUpdate(id, { role });
    return sendResponse(req, res, true, 'Cập nhật role thành công!', '/admin/users');
  } catch (error) {
    console.error('Update user role error:', error);
    return sendResponse(req, res, false, 'Có lỗi xảy ra khi cập nhật role', '/admin/users');
  }
});

router.delete('/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (id === String(req.session.userId)) {
      return sendResponse(req, res, false, 'Không thể xóa chính mình', '/admin/users');
    }

    const locationIds = await Location.find({ owner: id }).distinct('_id');
    await Promise.all([
      Review.deleteMany({ user: id }),
      Location.deleteMany({ owner: id }),
      Voucher.deleteMany({ location: { $in: locationIds } }),
      User.findByIdAndDelete(id)
    ]);

    return sendResponse(req, res, true, 'Xóa người dùng thành công!', '/admin/users');
  } catch (error) {
    console.error('Delete user error:', error);
    return sendResponse(req, res, false, 'Có lỗi xảy ra khi xóa người dùng', '/admin/users');
  }
});

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

router.delete('/admin/locations/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await Promise.all([
      Voucher.deleteMany({ location: id }),
      Review.deleteMany({ location: id }),
      Location.findByIdAndDelete(id)
    ]);

    req.flash('success', 'Xóa địa điểm thành công!');
    res.redirect('/admin/locations');
  } catch (error) {
    console.error('Delete location error:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa địa điểm');
    res.redirect('/admin/locations');
  }
});

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
router.get('/admin/reviews/:reviewId', requireAuth, requireAdmin, reviewController.adminGetReviewDetail);
router.delete('/admin/reviews/:reviewId', requireAuth, requireAdmin, reviewController.adminDeleteReview);

module.exports = router;
