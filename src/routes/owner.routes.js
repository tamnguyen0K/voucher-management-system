/**
 * File: routes/owner.routes.js
 * 
 * Mô tả: Định nghĩa các routes dành cho chủ sở hữu (Owner)
 * - Dashboard với thống kê
 * - Quản lý địa điểm
 * - Xem profile
 * - Quản lý reviews của địa điểm thuộc sở hữu
 * 
 * Công nghệ sử dụng:
 * - Express.js Router: Định nghĩa routes
 * - Middleware requireAuth, requireRole: Xác thực quyền owner
 * - Router.use(): Áp dụng middleware cho tất cả routes trong router
 */

const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/owner.controller');
const userController = require('../controllers/user.controller');
const reviewController = require('../controllers/review.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('owner'));

router.get('/dashboard', ownerController.renderDashboard);
router.get('/locations', ownerController.listLocations);
router.get('/profile', userController.getOwnerProfile);
router.get('/reviews', reviewController.getOwnerReviews);
router.get('/reviews/:reviewId', reviewController.ownerGetReviewDetail);

module.exports = router;
