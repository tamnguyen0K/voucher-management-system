// Router xử lý các route liên quan đến voucher (mã giảm giá)
const express = require('express');
const router = express.Router();

const voucherController = require('../controllers/voucher.controller');
const { requireAuth, requireOwner } = require('../middleware/auth');

// ========== PUBLIC ROUTES ==========
// Ai cũng có thể xem danh sách voucher
router.get('/vouchers', voucherController.getAllVouchers);

// ========== USER ROUTES ==========
// Người dùng đã đăng nhập có thể nhận voucher
router.post('/vouchers/:voucherId/claim', requireAuth, voucherController.claimVoucher);

// ========== OWNER ROUTES ==========
// Chủ cửa hàng có thể quản lý voucher của mình
router.get('/owner/vouchers', requireAuth, requireOwner, voucherController.getOwnerVouchers);
router.post('/owner/vouchers', requireAuth, requireOwner, voucherController.createVoucher);
router.put('/owner/vouchers/:id', requireAuth, requireOwner, voucherController.updateVoucher);
router.delete('/owner/vouchers/:id', requireAuth, requireOwner, voucherController.deleteVoucher);

// ========== EXPORT ROUTER ==========
module.exports = router;