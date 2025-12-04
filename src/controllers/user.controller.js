/**
 * File: controllers/user.controller.js
 * 
 * Mô tả: Controller xử lý các thao tác liên quan đến người dùng (User)
 * - Đăng ký, đăng nhập, đăng xuất
 * - Xem và quản lý thông tin cá nhân
 * - Quản lý vouchers đã claim và reviews đã tạo
 * 
 * Công nghệ sử dụng:
 * - Express.js: Framework web server
 * - Mongoose: ODM cho MongoDB
 * - Bcrypt: Mã hóa mật khẩu (thông qua User model)
 * - Express Session: Quản lý phiên đăng nhập
 * - EJS: Template engine để render views
 */

const User = require('../models/user.model');
const Review = require('../models/review.model');
const Location = require('../models/location.model');
const Voucher = require('../models/voucher.model');

const renderLoginRegister = (req, res) => {
  res.render('pages/login_register', {
    title: 'Đăng nhập / Đăng ký',
    error: req.flash('error'),
    success: req.flash('success'),
    activeTab: req.query.tab || 'login'
  });
};

const validateRegistration = (username, email, password, confirmPassword, phonenumber, role) => {
    if (password !== confirmPassword) {
    return { error: 'Mật khẩu xác nhận không khớp' };
    }

    const allowedRoles = ['user', 'owner'];
    const selectedRole = role && allowedRoles.includes(role) ? role : 'user';

    if (!phonenumber || !/^[0-9]{9,11}$/.test(phonenumber)) {
    return { error: 'Số điện thoại không hợp lệ (phải có 9-11 chữ số)' };
  }

  return { selectedRole };
};

const register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, role, phonenumber } = req.body;

    const validation = validateRegistration(username, email, password, confirmPassword, phonenumber, role);
    if (validation.error) {
      req.flash('error', validation.error);
      return res.redirect('/auth?tab=register');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username },
        { phoneNumber: phonenumber.trim() }
      ]
    });

    if (existingUser) {
      const errorMsg = existingUser.email === normalizedEmail ? 'Email đã tồn tại'
        : existingUser.username === username ? 'Tên đăng nhập đã tồn tại'
        : existingUser.phoneNumber === phonenumber.trim() ? 'Số điện thoại đã được sử dụng'
        : 'Thông tin đã tồn tại trong hệ thống';
      req.flash('error', errorMsg);
      return res.redirect('/auth?tab=register');
    }

    const user = new User({
      username,
      idName: username,
      phoneNumber: phonenumber.trim(),
      email: normalizedEmail,
      password,
      role: validation.selectedRole
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

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error', 'Vui lòng nhập đầy đủ email và mật khẩu');
      return res.redirect('/auth?tab=login');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user || !(await user.comparePassword(password))) {
      req.flash('error', 'Email hoặc mật khẩu không đúng');
      return res.redirect('/auth?tab=login');
    }

    req.session.userId = user._id;
    req.session.userRole = user.role;
    req.session.username = user.username;

    req.flash('success', `Chào mừng ${user.username}!`);
    
    const redirectUrl = user.role === 'admin' ? '/admin/dashboard'
      : user.role === 'owner' ? '/owner/dashboard'
      : '/';

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Có lỗi xảy ra khi đăng nhập');
    res.redirect('/auth?tab=login');
  }
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Logout error:', err);
    res.redirect('/');
  });
};

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

    const [reviews, now] = await Promise.all([
      Review.find({ user: userId }).populate('location', 'name').sort({ createdAt: -1 }),
      Promise.resolve(new Date())
    ]);

    const validClaimedVouchers = user.claimedVouchers.filter(v => new Date(v.expiryDate) > now);
    if (user.claimedVouchers.length !== validClaimedVouchers.length) {
      user.claimedVouchers = validClaimedVouchers;
      await user.save();
    }

    res.render('pages/profile', {
      title: 'Thông tin cá nhân',
      profile: {
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

    const locations = await Location.find({ owner: userId }).sort({ createdAt: -1 });
    const locationIds = locations.map(loc => loc._id);

    const vouchers = await Voucher.find({ location: { $in: locationIds } })
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    res.render('owner/profile', {
      title: 'Thông tin cá nhân',
      profile: {
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
