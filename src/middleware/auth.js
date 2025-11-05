/**
 * File: middleware/auth.js
 * Mô tả: Cung cấp các middleware kiểm tra đăng nhập và phân quyền người dùng
 */

const User = require('../models/user.model');

/**
 * Middleware: requireAuth
 * Mô tả: Kiểm tra người dùng đã đăng nhập hay chưa
 * Nếu chưa đăng nhập, chuyển hướng về trang đăng nhập
 */
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  } else {
    req.flash('error', 'Vui lòng đăng nhập để tiếp tục');
    res.redirect('/auth');
  }
};

/**
 * Middleware: requireAdmin
 * Mô tả: Kiểm tra quyền truy cập của người dùng là "admin"
 * Nếu không phải admin, chặn truy cập và chuyển hướng về trang chủ
 */
const requireAdmin = (req, res, next) => {
  if (req.session && req.session.userRole === 'admin') {
    return next();
  } else {
    req.flash('error', 'Bạn không có quyền truy cập trang này');
    res.redirect('/');
  }
};

/**
 * Middleware: requireOwner
 * Mô tả: Cho phép truy cập nếu người dùng là "owner" hoặc "admin"
 * Dùng cho các trang quản lý của chủ cửa hàng
 */
const requireOwner = (req, res, next) => {
  if (req.session && (req.session.userRole === 'owner' || req.session.userRole === 'admin')) {
    return next();
  } else {
    req.flash('error', 'Bạn không có quyền truy cập trang này');
    res.redirect('/');
  }
};

/**
 * Middleware: requireUser
 * Mô tả: Cho phép truy cập nếu người dùng thuộc 1 trong 3 nhóm: "user", "owner", "admin"
 * Dùng cho các trang yêu cầu người dùng đăng nhập
 */
const requireUser = (req, res, next) => {
  if (req.session && req.session.userRole && ['user', 'owner', 'admin'].includes(req.session.userRole)) {
    return next();
  } else {
    req.flash('error', 'Vui lòng đăng nhập để tiếp tục');
    res.redirect('/auth');
  }
};

/**
 * Middleware: redirectIfAuthenticated
 * Mô tả: Nếu người dùng đã đăng nhập, chuyển hướng họ đến trang phù hợp
 * admin → /admin/dashboard, owner → /owner/dashboard, user → /
 * Dùng cho các trang login/register để tránh login lại khi đã đăng nhập
 */
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    if (req.session.userRole === 'admin') {
      return res.redirect('/admin/dashboard');
    } else if (req.session.userRole === 'owner') {
      return res.redirect('/owner/dashboard');
    } else {
      return res.redirect('/');
    }
  }
  next();
};

/**
 * Middleware: addUserToLocals
 * Mô tả: Thêm thông tin người dùng hiện tại vào biến res.locals.user
 * Giúp EJS truy cập trực tiếp thông tin user trong view
 * Nếu chưa đăng nhập thì đặt user = null
 */
const addUserToLocals = (req, res, next) => {
  if (req.session && req.session.userId) {
    res.locals.user = {
      id: req.session.userId,
      username: req.session.username,
      role: req.session.userRole
    };
  } else {
    res.locals.user = null;
  }
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireOwner,
  requireUser,
  redirectIfAuthenticated,
  addUserToLocals
};
