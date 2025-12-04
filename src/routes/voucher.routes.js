/**
 * File: routes/voucher.routes.js
 * 
 * Mô tả: Định nghĩa các routes liên quan đến voucher
 * - Xem danh sách voucher đang hoạt động
 * - Claim voucher (chỉ user)
 * - Lấy trạng thái voucher (API)
 * - CRUD voucher (chỉ owner)
 * 
 * Công nghệ sử dụng:
 * - Express.js Router: Định nghĩa routes
 * - Middleware requireAuth, requireOwner: Xác thực quyền truy cập
 */

const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');
const { requireAuth, requireOwner } = require('../middleware/auth');

router.get('/vouchers', voucherController.getAllVouchers);
router.post('/vouchers/:voucherId/claim', requireAuth, voucherController.claimVoucher);
router.get('/vouchers/:voucherId/status', requireAuth, voucherController.getVoucherStatus);
router.get('/owner/vouchers', requireAuth, requireOwner, voucherController.getOwnerVouchers);
router.post('/owner/vouchers', requireAuth, requireOwner, voucherController.createVoucher);
router.put('/owner/vouchers/:id', requireAuth, requireOwner, voucherController.updateVoucher);
router.delete('/owner/vouchers/:id', requireAuth, requireOwner, voucherController.deleteVoucher);

module.exports = router;
