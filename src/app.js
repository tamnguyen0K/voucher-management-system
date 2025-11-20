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
const locationMeta = require('./utils/locationMetadata');

const userRoutes = require('./routes/user.routes');
const locationRoutes = require('./routes/location.routes');
const voucherRoutes = require('./routes/voucher.routes');
const adminRoutes = require('./routes/admin.routes');
const ownerRoutes = require('./routes/owner.routes');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.locals.locationMeta = locationMeta;

app.use('/', userRoutes);
app.use('/', locationRoutes);
app.use('/', voucherRoutes);
app.use('/', adminRoutes);
app.use('/owner', ownerRoutes);

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
