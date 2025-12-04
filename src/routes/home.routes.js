/**
 * File: routes/home.routes.js
 * 
 * Mô tả: Định nghĩa route cho trang chủ
 * - Hiển thị danh sách địa điểm mới nhất (6 items)
 * - Hiển thị danh sách voucher đang hoạt động (6 items)
 * 
 * Công nghệ sử dụng:
 * - Express.js Router: Định nghĩa routes
 * - Mongoose: Query database để lấy locations và vouchers
 * - EJS: Render view trang chủ
 */

const express = require('express');
const router = express.Router();
const Location = require('../models/location.model');
const Voucher = require('../models/voucher.model');

const LIMIT_ITEMS = 6;

router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const [locations, vouchers] = await Promise.all([
      Location.find().populate('owner', 'username').sort({ createdAt: -1 }).limit(LIMIT_ITEMS),
      Voucher.find({
      startDate: { $lte: now },
      endDate: { $gte: now },
      $expr: { $lt: ['$quantityClaimed', '$quantityTotal'] }
    })
      .populate('location', 'name imageUrl')
      .sort({ createdAt: -1 })
        .limit(LIMIT_ITEMS)
    ]);

    res.render('pages/home', {
      title: 'Trang chủ',
      locations,
      vouchers
    });
  } catch (error) {
    console.error('Home page error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải trang chủ');
    res.render('pages/home', {
      title: 'Trang chủ',
      locations: [],
      vouchers: []
    });
  }
});

module.exports = router;
