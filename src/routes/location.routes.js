/**
 * File: routes/location.routes.js
 * 
 * Mô tả: Định nghĩa các routes liên quan đến địa điểm (Location) và đánh giá (Review)
 * - Xem danh sách và chi tiết địa điểm
 * - Tạo review cho địa điểm (với upload media)
 * - CRUD địa điểm (chỉ owner)
 * - Lấy số lần review còn lại của user
 * 
 * Công nghệ sử dụng:
 * - Express.js Router: Định nghĩa routes
 * - Multer: Xử lý upload file (ảnh/video) cho reviews
 * - Middleware requireAuth, requireOwner: Xác thực quyền truy cập
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const reviewController = require('../controllers/review.controller');
const { reviewUpload } = require('../middleware/upload');
const { requireAuth, requireOwner } = require('../middleware/auth');

const handleReviewUpload = (req, res, next) => {
  const upload = reviewUpload.array('mediaFiles', 5);
  upload(req, res, (err) => {
    if (err) {
      console.error('[ReviewUpload] Error:', err);
      const locationId = req.params.locationId || '';
      
      if (err instanceof multer.MulterError) {
        const errorMsg = err.code === 'LIMIT_FILE_SIZE' ? 'Kích thước tệp quá lớn (tối đa 15MB)'
          : err.code === 'LIMIT_FILE_COUNT' ? 'Số lượng tệp quá nhiều (tối đa 5 tệp)'
          : `Lỗi tải tệp lên: ${err.message}`;
        req.flash('error', errorMsg);
      } else {
        req.flash('error', err.message?.includes('Chỉ chấp nhận') ? err.message : 'Không thể tải tệp lên. Vui lòng thử lại.');
      }
      
      return res.redirect(`/locations/${locationId}`);
    }
    next();
  });
};

router.get('/locations', locationController.getAllLocations);
router.get('/locations/:id', locationController.getLocationById);
router.get('/locations/:locationId/reviews/remaining', requireAuth, reviewController.getReviewRemainingCount);
router.post('/locations/:locationId/reviews', requireAuth, handleReviewUpload, reviewController.createReview);
router.post('/owner/locations', requireAuth, requireOwner, locationController.createLocation);
router.put('/owner/locations/:id', requireAuth, requireOwner, locationController.updateLocation);
router.delete('/owner/locations/:id', requireAuth, requireOwner, locationController.deleteLocation);

module.exports = router;
