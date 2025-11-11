/**
 * File: middleware/auth.js
 * Purpose: Authentication and authorization helpers/middlewares
 */

const redirectUnauthorized = (req, res) => {
  if (!req.session || !req.session.userId) {
    req.flash('error', 'Vui long dang nhap de tiep tuc');
    return res.redirect('/auth');
  }

  req.flash('error', 'Ban khong co quyen truy cap trang nay');
  return res.redirect('/');
};

const requireRole = (...roles) => (req, res, next) => {
  if (req.session && roles.includes(req.session.userRole)) {
    return next();
  }
  return redirectUnauthorized(req, res);
};

const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return redirectUnauthorized(req, res);
};

const requireAdmin = requireRole('admin');
const requireOwner = requireRole('owner', 'admin');
const requireUser = requireRole('user', 'owner', 'admin');

const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    if (req.session.userRole === 'admin') {
      return res.redirect('/admin/dashboard');
    }
    if (req.session.userRole === 'owner') {
      return res.redirect('/owner/dashboard');
    }
    return res.redirect('/');
  }
  next();
};

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
  requireRole,
  redirectIfAuthenticated,
  addUserToLocals
};
