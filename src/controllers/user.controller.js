/**
 * File: controllers/user.controller.js
 * Mô tả: Xử lý đăng nhập, đăng ký, đăng xuất và quản lý thông tin người dùng
 */

const User = require('../models/user.model');
const Review = require('../models/review.model');
const Voucher = require('../models/voucher.model');

/**
 * Hàm: renderLoginRegister
 * Mô tả: Hiển thị trang đăng nhập / đăng ký
 */
const renderLoginRegister = (req, res) => {
  const activeTab = req.query.tab || 'login';
  res.render('pages/login_register', {
    title: 'Đăng nhập / Đăng ký',
    error: req.flash('error'),
    success: req.flash('success'),
    activeTab
  });
};

/**
 * Hàm: register
 * Mô tả: Đăng ký tài khoản người dùng mới
 */
const register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, role, phonenumber } = req.body;

    if (password !== confirmPassword) {
      req.flash('error', 'Mật khẩu xác nhận không khớp');
      return res.redirect('/auth?tab=register');
    }

    const allowedRoles = ['user', 'owner'];
    const selectedRole = role && allowedRoles.includes(role) ? role : 'user';

    if (!phonenumber || !/^[0-9]{9,11}$/.test(phonenumber)) {
      req.flash('error', 'Số điện thoại không hợp lệ (phải có 9-11 chữ số)');
      return res.redirect('/auth?tab=register');
    }

    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { username },
        { phoneNumber: phonenumber.trim() }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase().trim()) {
        req.flash('error', 'Email đã tồn tại');
      } else if (existingUser.username === username) {
        req.flash('error', 'Tên đăng nhập đã tồn tại');
      } else if (existingUser.phoneNumber === phonenumber.trim()) {
        req.flash('error', 'Số điện thoại đã được sử dụng');
      } else {
        req.flash('error', 'Thông tin đã tồn tại trong hệ thống');
      }
      return res.redirect('/auth?tab=register');
    }

    const user = new User({
      username,
      idName: username,
      phoneNumber: phonenumber.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: selectedRole
    });

    await user.save();

    req.flash('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
    res.redirect('/auth?tab=login');
  } catch (error) {
    console.error('Register error:', error);
    req.flash('error', 'Có lỗi xảy ra khi đăng ký');
    res.redirect('/auth?tab=register');
  }
};

/**
 * Hàm: login
 * Mô tả: Đăng nhập người dùng
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error', 'Vui lòng nhập đầy đủ email và mật khẩu');
      return res.redirect('/auth?tab=login');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      req.flash('error', 'Email hoặc mật khẩu không đúng');
      return res.redirect('/auth?tab=login');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Email hoặc mật khẩu không đúng');
      return res.redirect('/auth?tab=login');
    }

    req.session.userId = user._id;
    req.session.userRole = user.role;
    req.session.username = user.username;

    req.flash('success', `Chào mừng ${user.username}!`);
    
    let redirectUrl = '/';
    if (user.role === 'admin') {
      redirectUrl = '/admin/dashboard';
    } else if (user.role === 'owner') {
      redirectUrl = '/owner/dashboard';
    }

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Có lỗi xảy ra khi đăng nhập');
    res.redirect('/auth?tab=login');
  }
};

/**
 * Hàm: logout
 * Mô tả: Đăng xuất người dùng
 */
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/');
  });
};

/**
 * Hàm: getProfile
 * Mô tả: Xem thông tin cá nhân người dùng thường
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (req.session.userRole === 'owner') {
      return res.redirect('/owner/profile');
    }
    
    const user = await User.findById(userId);
    if (!user) {
      req.flash('error', 'Không tìm thấy thông tin người dùng');
      return res.redirect('/');
    }

    const reviews = await Review.find({ user: userId })
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    const now = new Date();
    const validClaimedVouchers = user.claimedVouchers.filter(v => new Date(v.expiryDate) > now);

    if (user.claimedVouchers.length !== validClaimedVouchers.length) {
      user.claimedVouchers = validClaimedVouchers;
      await user.save();
    }

    res.render('pages/profile', {
      title: 'Thông tin cá nhân',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        createdAt: user.createdAt
      },
      reviews,
      claimedVouchers: validClaimedVouchers
    });
  } catch (error) {
    console.error('Get profile error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải thông tin');
    res.redirect('/');
  }
};

/**
 * Hàm: getOwnerProfile
 * Mô tả: Xem thông tin cá nhân của owner
 */
const getOwnerProfile = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (req.session.userRole === 'user') {
      req.flash('error', 'Bạn không có quyền truy cập');
      return res.redirect('/');
    }

    const user = await User.findById(userId);
    if (!user) {
      req.flash('error', 'Không tìm thấy thông tin người dùng');
      return res.redirect('/');
    }

    const Location = require('../models/location.model');
    const Voucher = require('../models/voucher.model');

    const locations = await Location.find({ owner: userId }).sort({ createdAt: -1 });
    const locationIds = locations.map(loc => loc._id);

    const vouchers = await Voucher.find({ location: { $in: locationIds } })
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    res.render('owner/profile', {
      title: 'Thông tin cá nhân',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        createdAt: user.createdAt
      },
      locations,
      vouchers
    });
  } catch (error) {
    console.error('Get owner profile error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải thông tin');
    res.redirect('/owner/dashboard');
  }
};

module.exports = {
  renderLoginRegister,
  register,
  login,
  logout,
  getProfile,
  getOwnerProfile
};
