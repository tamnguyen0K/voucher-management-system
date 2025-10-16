// Import thư viện express để sử dụng Router
const express = require('express');
const router = express.Router();

// Import controller xử lý logic liên quan đến voucher
const voucherController = require('../controllers/voucher.controller');

// Import middleware kiểm tra quyền đăng nhập và quyền chủ sở hữu (owner)
const { requireAuth, requireOwner } = require('../middleware/auth');


// ==========================
// Public routes (các route công khai, ai cũng truy cập được)
// ==========================

// Lấy danh sách tất cả các voucher có sẵn (ai cũng xem được)
// GET /vouchers
router.get('/vouchers', voucherController.getAllVouchers);


// ==========================
// User routes (các route chỉ dành cho người dùng đã đăng nhập)
// ==========================

// Người dùng đăng nhập có thể nhận (claim) một voucher
// POST /vouchers/:voucherId/claim
// requireAuth đảm bảo chỉ người dùng đã đăng nhập mới thực hiện được
router.post('/vouchers/:voucherId/claim', requireAuth, voucherController.claimVoucher);


// ==========================
// Owner routes (các route chỉ dành cho chủ cửa hàng hoặc admin)
// ==========================

// Lấy danh sách voucher do chủ sở hữu tạo ra
// GET /owner/vouchers
// requireAuth: phải đăng nhập
// requireOwner: phải có quyền chủ cửa hàng
router.get('/owner/vouchers', requireAuth, requireOwner, voucherController.getOwnerVouchers);

// Tạo một voucher mới
// POST /owner/vouchers
router.post('/owner/vouchers', requireAuth, requireOwner, voucherController.createVoucher);

// Cập nhật thông tin voucher theo ID
// PUT /owner/vouchers/:id
router.put('/owner/vouchers/:id', requireAuth, requireOwner, voucherController.updateVoucher);

// Xóa voucher theo ID
// DELETE /owner/vouchers/:id
router.delete('/owner/vouchers/:id', requireAuth, requireOwner, voucherController.deleteVoucher);


// ==========================
// Xuất router để sử dụng trong file app.js hoặc server.js
// ==========================
module.exports = router;