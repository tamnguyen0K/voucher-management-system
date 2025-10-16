// Import thư viện express để tạo router
const express = require('express');

// Khởi tạo một đối tượng router từ Express
const router = express.Router();

// Import controller xử lý logic của user (nơi chứa các hàm như register, login, logout, v.v.)
const userController = require('../controllers/user.controller');

// Import middleware requireAuth để kiểm tra người dùng đã đăng nhập chưa
const { requireAuth } = require('../middleware/auth');


// ==========================
// Các route liên quan đến xác thực (Auth routes)
// ==========================

// Route hiển thị trang đăng nhập và đăng ký
// GET /auth
router.get('/auth', userController.renderLoginRegister);

// Route xử lý đăng ký người dùng mới
// POST /register
router.post('/register', userController.register);

// Route xử lý đăng nhập người dùng
// POST /login
router.post('/login', userController.login);

// Route xử lý đăng xuất người dùng
// POST /logout
router.post('/logout', userController.logout);


// ==========================
// Các route liên quan đến hồ sơ cá nhân (Profile routes)
// ==========================

// Route hiển thị trang hồ sơ cá nhân của người dùng
// GET /profile
// requireAuth: middleware đảm bảo chỉ người đã đăng nhập mới xem được profile
router.get('/profile', requireAuth, userController.getProfile);


// ==========================
// Xuất router để file app.js (hoặc server.js) có thể sử dụng
// ==========================
module.exports = router;