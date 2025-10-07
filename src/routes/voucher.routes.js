const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucher.controller');
const { requireAuth, requireOwner } = require('../middleware/auth');

// Public routes
router.get('/vouchers', voucherController.getAllVouchers);

// User routes
router.post('/vouchers/:voucherId/claim', requireAuth, voucherController.claimVoucher);

// Owner routes
router.get('/owner/vouchers', requireAuth, requireOwner, voucherController.getOwnerVouchers);
router.post('/owner/vouchers', requireAuth, requireOwner, voucherController.createVoucher);
router.put('/owner/vouchers/:id', requireAuth, requireOwner, voucherController.updateVoucher);
router.delete('/owner/vouchers/:id', requireAuth, requireOwner, voucherController.deleteVoucher);

module.exports = router;
