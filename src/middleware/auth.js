const User = require('../models/user.model');

// Check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  } else {
    req.flash('error', 'Vui lòng đăng nhập để tiếp tục');
    res.redirect('/auth');
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.session && req.session.userRole === 'admin') {
    return next();
  } else {
    req.flash('error', 'Bạn không có quyền truy cập trang này');
    res.redirect('/');
  }
};

// Check if user is owner or admin
const requireOwner = (req, res, next) => {
  if (req.session && (req.session.userRole === 'owner' || req.session.userRole === 'admin')) {
    return next();
  } else {
    req.flash('error', 'Bạn không có quyền truy cập trang này');
    res.redirect('/');
  }
};

// Check if user is owner, admin, or regular user
const requireUser = (req, res, next) => {
  if (req.session && req.session.userRole && ['user', 'owner', 'admin'].includes(req.session.userRole)) {
    return next();
  } else {
    req.flash('error', 'Vui lòng đăng nhập để tiếp tục');
    res.redirect('/auth');
  }
};

// Redirect authenticated users
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

// Add user info to locals for EJS templates
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
