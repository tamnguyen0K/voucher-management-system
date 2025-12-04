/**
 * File: middleware/auth.js
 * 
 * Mô tả: Middleware xác thực và phân quyền người dùng
 * - requireAuth: Yêu cầu đăng nhập
 * - requireRole: Yêu cầu role cụ thể (admin, owner, user)
 * - requireAdmin/requireOwner/requireUser: Middleware cho từng role
 * - redirectIfAuthenticated: Redirect nếu đã đăng nhập (dùng cho trang login/register)
 * - addUserToLocals: Thêm thông tin user vào res.locals để dùng trong views
 * 
 * Công nghệ sử dụng:
 * - Express.js: Request/Response handling
 * - Express-session: Quản lý session
 * - Connect-flash: Flash messages
 */

const redirectUnauthorized = (req, res, isAuth = false) => {
  req.flash('error', isAuth ? 'Vui lòng đăng nhập để tiếp tục' : 'Bạn không có quyền truy cập trang này');
  return res.redirect(isAuth ? '/auth' : '/');
};

const requireRole = (...roles) => (req, res, next) => {
  if (req.session?.userRole && roles.includes(req.session.userRole)) return next();
  return redirectUnauthorized(req, res, !req.session?.userId);
};

const requireAuth = (req, res, next) => {
  if (req.session?.userId) return next();
  return redirectUnauthorized(req, res, true);
};

const requireAdmin = requireRole('admin');
const requireOwner = requireRole('owner', 'admin');
const requireUser = requireRole('user', 'owner', 'admin');

const redirectIfAuthenticated = (req, res, next) => {
  if (!req.session?.userId) return next();
  const role = req.session.userRole;
  const redirectMap = { admin: '/admin/dashboard', owner: '/owner/dashboard' };
  return res.redirect(redirectMap[role] || '/');
};

const addUserToLocals = (req, res, next) => {
  res.locals.user = req.session?.userId ? {
    id: req.session.userId,
    username: req.session.username,
    role: req.session.userRole
  } : null;
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
