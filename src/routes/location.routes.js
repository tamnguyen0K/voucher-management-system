// Router xử lý các route liên quan đến địa điểm và đánh giá
const express = require('express');
const router = express.Router();

// Controller xử lý logic chính
const locationController = require('../controllers/location.controller');
const reviewController = require('../controllers/review.controller');

// Middleware kiểm tra đăng nhập và quyền chủ sở hữu
const { requireAuth, requireOwner } = require('../middleware/auth');

// ========== PUBLIC ROUTES ==========
// Lấy danh sách hoặc chi tiết địa điểm (ai cũng truy cập được)
router.get('/locations', locationController.getAllLocations);
router.get('/locations/:id', locationController.getLocationById);
router.get('/locations/:id/summary', locationController.getLocationSummary);

// ========== REVIEW ROUTES ==========
// Người dùng đã đăng nhập mới được viết đánh giá
router.post('/locations/:locationId/reviews', requireAuth, reviewController.createReview);

// ========== OWNER ROUTES ==========
// Chỉ chủ địa điểm mới được thêm, sửa, xóa địa điểm
router.post('/owner/locations', requireAuth, requireOwner, locationController.createLocation);
router.put('/owner/locations/:id', requireAuth, requireOwner, locationController.updateLocation);
router.delete('/owner/locations/:id', requireAuth, requireOwner, locationController.deleteLocation);

// ========== EXPORT ROUTER ==========
module.exports = router;