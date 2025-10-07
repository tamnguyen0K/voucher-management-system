const User = require('../models/user.model');
const Review = require('../models/review.model');
const Voucher = require('../models/voucher.model');

// Render login/register page
const renderLoginRegister = (req, res) => {
  res.render('pages/login_register', {
    title: 'Đăng nhập / Đăng ký',
    error: req.flash('error'),
    success: req.flash('success')
  });
};

// Register user
const register = async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (password !== confirmPassword) {
      req.flash('error', 'Mật khẩu xác nhận không khớp');
      return res.redirect('/auth');
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      req.flash('error', 'Email hoặc username đã tồn tại');
      return res.redirect('/auth');
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: 'user'
    });

    await user.save();

    req.flash('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
    res.redirect('/auth');
  } catch (error) {
    console.error('Register error:', error);
    req.flash('error', 'Có lỗi xảy ra khi đăng ký');
    res.redirect('/auth');
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Email hoặc mật khẩu không đúng');
      return res.redirect('/auth');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Email hoặc mật khẩu không đúng');
      return res.redirect('/auth');
    }

    // Set session
    req.session.userId = user._id;
    req.session.userRole = user.role;
    req.session.username = user.username;

    req.flash('success', `Chào mừng ${user.username}!`);
    
    // Redirect based on role
    if (user.role === 'admin') {
      res.redirect('/admin/dashboard');
    } else if (user.role === 'owner') {
      res.redirect('/owner/dashboard');
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Có lỗi xảy ra khi đăng nhập');
    res.redirect('/auth');
  }
};

// Logout user
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    
    // Get user reviews
    const reviews = await Review.find({ user: userId })
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    // Get claimed vouchers (placeholder - would need voucher history model)
    const claimedVouchers = [];

    res.render('pages/profile', {
      title: 'Thông tin cá nhân',
      user: req.session,
      reviews,
      claimedVouchers
    });
  } catch (error) {
    console.error('Get profile error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải thông tin');
    res.redirect('/');
  }
};

module.exports = {
  renderLoginRegister,
  register,
  login,
  logout,
  getProfile
};
