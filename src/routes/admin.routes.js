const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Location = require('../models/location.model');
const Voucher = require('../models/voucher.model');
const Review = require('../models/review.model');
const reviewController = require('../controllers/review.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Admin dashboard
router.get('/admin/dashboard', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Get statistics
    const totalUsers = await User.countDocuments();
    const totalLocations = await Location.countDocuments();
    const totalVouchers = await Voucher.countDocuments();
    const totalReviews = await Review.countDocuments();

    // Get recent activities
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
    const recentLocations = await Location.find()
      .populate('owner', 'username')
      .sort({ createdAt: -1 })
      .limit(5);
    const recentVouchers = await Voucher.find()
      .populate('location', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get voucher statistics
    const activeVouchers = await Voucher.countDocuments({
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      quantityClaimed: { $lt: { $expr: '$quantityTotal' } }
    });

    const expiredVouchers = await Voucher.countDocuments({
      endDate: { $lt: new Date() }
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

// Manage users
router.get('/admin/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.render('admin/manage_users', {
      title: 'Quản lý Người dùng',
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải danh sách người dùng');
    res.redirect('/admin/dashboard');
  }
});

// Update user role
router.put('/admin/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'owner', 'admin'].includes(role)) {
      req.flash('error', 'Role không hợp lệ');
      return res.redirect('/admin/users');
    }

    await User.findByIdAndUpdate(id, { role });
    req.flash('success', 'Cập nhật role thành công!');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Update user role error:', error);
    req.flash('error', 'Có lỗi xảy ra khi cập nhật role');
    res.redirect('/admin/users');
  }
});

// Delete user
router.delete('/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting yourself
    if (id === req.session.userId) {
      req.flash('error', 'Không thể xóa chính mình');
      return res.redirect('/admin/users');
    }

    // Delete related data
    await Review.deleteMany({ user: id });
    await Location.deleteMany({ owner: id });
    await Voucher.deleteMany({ location: { $in: await Location.find({ owner: id }).distinct('_id') } });
    
    await User.findByIdAndDelete(id);
    req.flash('success', 'Xóa người dùng thành công!');
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Delete user error:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa người dùng');
    res.redirect('/admin/users');
  }
});

// Manage locations
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

// Delete location (admin)
router.delete('/admin/locations/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Delete related data
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

// Manage vouchers
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

// Delete voucher (admin)
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

// Manage reviews
router.get('/admin/reviews', requireAuth, requireAdmin, reviewController.getAllReviews);
router.delete('/admin/reviews/:reviewId', requireAuth, requireAdmin, reviewController.adminDeleteReview);

module.exports = router;
