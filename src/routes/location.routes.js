// Import thư viện express và tạo router để định nghĩa các route
const express = require('express');
const router = express.Router();

// Import các controller để xử lý logic cho từng phần
const locationController = require('../controllers/location.controller'); // Xử lý dữ liệu địa điểm
const reviewController = require('../controllers/review.controller');     // Xử lý dữ liệu đánh giá (review)

// Import middleware kiểm tra xác thực và quyền của người dùng
const { requireAuth, requireOwner } = require('../middleware/auth'); // requireAuth: bắt buộc đăng nhập, requireOwner: bắt buộc là chủ địa điểm

// =============================
// PUBLIC ROUTES - Ai cũng truy cập được
// =============================

// Lấy danh sách tất cả địa điểm (hiển thị cho người dùng)
router.get('/locations', locationController.getAllLocations);

// Lấy chi tiết 1 địa điểm cụ thể (theo id)
router.get('/locations/:id', locationController.getLocationById);

// =============================
// REVIEW ROUTES - Người dùng đã đăng nhập mới được review
// =============================

// Tạo review mới cho một địa điểm (locationId được truyền trong URL)
// requireAuth đảm bảo người dùng phải đăng nhập mới được viết đánh giá
router.post('/locations/:locationId/reviews', requireAuth, reviewController.createReview);

// =============================
// OWNER ROUTES - Chỉ chủ địa điểm mới được phép thao tác
// =============================

// Tạo địa điểm mới (ví dụ: một quán ăn, quán cà phê do chủ sở hữu đăng ký)
router.post('/owner/locations', requireAuth, requireOwner, locationController.createLocation);

// Cập nhật thông tin một địa điểm mà chủ sở hữu quản lý
router.put('/owner/locations/:id', requireAuth, requireOwner, locationController.updateLocation);

// Xóa một địa điểm thuộc quyền sở hữu của người đăng nhập hiện tại
router.delete('/owner/locations/:id', requireAuth, requireOwner, locationController.deleteLocation);

// =============================
// EXPORT ROUTER - Xuất router để dùng trong app chính
// =============================
module.exports = router;