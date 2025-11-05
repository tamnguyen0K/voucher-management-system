/**
 * File: app.js
 * Mô tả: File khởi tạo và cấu hình ứng dụng Express chính
 * Chức năng: Kết nối database, cấu hình middleware, định nghĩa routes, xử lý lỗi
 */

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config({ path: './src/config/dotenv' });

const connectDB = require('./config/db');
const { addUserToLocals } = require('./middleware/auth');

const userRoutes = require('./routes/user.routes');
const locationRoutes = require('./routes/location.routes');
const voucherRoutes = require('./routes/voucher.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/voucher_system'
  }),
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(flash());
app.use(addUserToLocals);

app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

app.use('/', userRoutes);
app.use('/', locationRoutes);
app.use('/', voucherRoutes);
app.use('/', adminRoutes);

/**
 * Route: GET /
 * Mô tả: Hiển thị trang chủ với danh sách địa điểm và voucher mới nhất
 */
app.get('/', async (req, res) => {
  try {
    const Location = require('./models/location.model');
    const Voucher = require('./models/voucher.model');

    const locations = await Location.find()
      .populate('owner', 'username')
      .sort({ createdAt: -1 })
      .limit(6);

    const now = new Date();
    const vouchers = await Voucher.find({
      startDate: { $lte: now },
      endDate: { $gte: now },
      $expr: { $lt: ['$quantityClaimed', '$quantityTotal'] }
    })
      .populate('location', 'name imageUrl')
      .sort({ createdAt: -1 })
      .limit(6);

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

const userController = require('./controllers/user.controller');
const { requireAuth: requireAuthMiddleware } = require('./middleware/auth');

/**
 * Route: GET /owner/profile
 * Mô tả: Hiển thị trang profile của owner
 */
app.get('/owner/profile', requireAuthMiddleware, userController.getOwnerProfile);

/**
 * Route: GET /owner/dashboard
 * Mô tả: Hiển thị dashboard quản lý của owner với thống kê địa điểm và voucher
 */
app.get('/owner/dashboard', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userRole !== 'owner') {
      req.flash('error', 'Bạn không có quyền truy cập');
      return res.redirect('/');
    }

    const Location = require('./models/location.model');
    const Voucher = require('./models/voucher.model');

    const locations = await Location.find({ owner: req.session.userId });
    const locationIds = locations.map(loc => loc._id);

    const vouchers = await Voucher.find({
      location: { $in: locationIds }
    })
      .populate('location', 'name')
      .sort({ createdAt: -1 });

    const totalVouchers = vouchers.length;
    const activeVouchers = vouchers.filter(v => v.status === 'active').length;
    const totalClaims = vouchers.reduce((sum, v) => sum + v.quantityClaimed, 0);

    res.render('owner/dashboard', {
      title: 'Owner Dashboard',
      stats: {
        totalLocations: locations.length,
        totalVouchers,
        activeVouchers,
        totalClaims
      },
      locations,
      vouchers: vouchers.slice(0, 5)
    });
  } catch (error) {
    console.error('Owner dashboard error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải dashboard');
    res.redirect('/');
  }
});

/**
 * Route: GET /owner/locations
 * Mô tả: Hiển thị danh sách địa điểm của owner
 */
app.get('/owner/locations', async (req, res) => {
  try {
    if (!req.session.userId || req.session.userRole !== 'owner') {
      req.flash('error', 'Bạn không có quyền truy cập');
      return res.redirect('/');
    }

    const Location = require('./models/location.model');
    const locations = await Location.find({ owner: req.session.userId }).sort({ createdAt: -1 });

    res.render('owner/manage_location', {
      title: 'Quản lý Địa điểm',
      locations
    });
  } catch (error) {
    console.error('Owner locations error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải danh sách địa điểm');
    res.redirect('/owner/dashboard');
  }
});

app.use((req, res) => {
  res.status(404).render('pages/404', {
    title: 'Không tìm thấy trang'
  });
});

app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).render('pages/error', {
    title: 'Lỗi hệ thống',
    error: process.env.NODE_ENV === 'development' ? error : {}
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});
