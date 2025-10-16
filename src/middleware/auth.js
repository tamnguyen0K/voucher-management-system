// Import model User để dùng khi cần truy vấn dữ liệu người dùng
const User = require('../models/user.model');

/* ==========================
   1️⃣ Middleware: requireAuth
   → Dùng để kiểm tra xem người dùng đã đăng nhập hay chưa.
   Nếu chưa đăng nhập thì chuyển hướng về trang /auth (login/register)
========================== */
const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    // Nếu session có userId => người dùng đã đăng nhập, cho phép tiếp tục
    return next();
  } else {
    // Nếu chưa đăng nhập thì hiện thông báo và chuyển hướng về trang login
    req.flash('error', 'Vui lòng đăng nhập để tiếp tục');
    res.redirect('/auth');
  }
};

/* ==========================
   2️⃣ Middleware: requireAdmin
   → Kiểm tra người dùng có quyền "admin" không.
   Nếu không phải admin => chặn truy cập và chuyển hướng về trang chủ.
========================== */
const requireAdmin = (req, res, next) => {
  if (req.session && req.session.userRole === 'admin') {
    return next();
  } else {
    req.flash('error', 'Bạn không có quyền truy cập trang này');
    res.redirect('/');
  }
};

/* ==========================
   3️⃣ Middleware: requireOwner
   → Cho phép truy cập nếu user là "owner" hoặc "admin".
   Dùng cho các trang quản lý của chủ cửa hàng.
========================== */
const requireOwner = (req, res, next) => {
  if (req.session && (req.session.userRole === 'owner' || req.session.userRole === 'admin')) {
    return next();
  } else {
    req.flash('error', 'Bạn không có quyền truy cập trang này');
    res.redirect('/');
  }
};

/* ==========================
   4️⃣ Middleware: requireUser
   → Cho phép truy cập nếu user có vai trò thuộc 1 trong 3 nhóm:
     "user", "owner", "admin"
   → Dùng cho các trang yêu cầu đăng nhập nói chung.
========================== */
const requireUser = (req, res, next) => {
  if (req.session && req.session.userRole && ['user', 'owner', 'admin'].includes(req.session.userRole)) {
    return next();
  } else {
    req.flash('error', 'Vui lòng đăng nhập để tiếp tục');
    res.redirect('/auth');
  }
};

/* ==========================
   5️⃣ Middleware: redirectIfAuthenticated
   → Nếu người dùng đã đăng nhập, chuyển họ đến trang phù hợp:
     - admin → /admin/dashboard
     - owner → /owner/dashboard
     - user → /
   → Dùng cho các trang login/register để tránh login lại khi đã đăng nhập.
========================== */
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
  // Nếu chưa đăng nhập thì tiếp tục vào route gốc
  next();
};

/* ==========================
   6️⃣ Middleware: addUserToLocals
   → Dùng để thêm thông tin người dùng vào biến `res.locals`
     → EJS có thể truy cập được biến `user` này trực tiếp trong view
   → Nếu chưa đăng nhập thì set user = null
========================== */
const addUserToLocals = (req, res, next) => {
  if (req.session && req.session.userId) {
    // Gán thông tin người dùng vào res.locals để view có thể dùng
    res.locals.user = {
      id: req.session.userId,
      username: req.session.username,
      role: req.session.userRole
    };
  } else {
    // Nếu không có user đăng nhập
    res.locals.user = null;
  }
  next();
};

// Xuất các middleware để dùng ở các route khác
module.exports = {
  requireAuth,
  requireAdmin,
  requireOwner,
  requireUser,
  redirectIfAuthenticated,
  addUserToLocals
};