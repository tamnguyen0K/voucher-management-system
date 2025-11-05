// Router xử lý các route liên quan đến người dùng (đăng ký, đăng nhập, hồ sơ)
const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/auth');

// ========== AUTH ROUTES ==========
// Xử lý đăng ký, đăng nhập, đăng xuất
router.get('/auth', userController.renderLoginRegister);
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);

// ========== PROFILE ROUTES ==========
// Hiển thị hồ sơ cá nhân (chỉ cho người đã đăng nhập)
router.get('/profile', requireAuth, userController.getProfile);

// ========== EXPORT ROUTER ==========
module.exports = router;