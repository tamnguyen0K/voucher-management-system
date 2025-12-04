/**
 * File: routes/user.routes.js
 * 
 * Mô tả: Định nghĩa các routes liên quan đến người dùng (User)
 * - Đăng ký, đăng nhập, đăng xuất
 * - Xem thông tin cá nhân (profile)
 * 
 * Công nghệ sử dụng:
 * - Express.js Router: Định nghĩa routes
 * - Middleware requireAuth: Xác thực người dùng đã đăng nhập
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/auth');

router.get('/auth', userController.renderLoginRegister);
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);
router.get('/profile', requireAuth, userController.getProfile);

module.exports = router;
