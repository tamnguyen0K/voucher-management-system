const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config({ path: './src/config/dotenv' });

const connectDB = require('./config/db');
const { addUserToLocals } = require('./middleware/auth');

// Import routes
const userRoutes = require('./routes/user.routes');
const locationRoutes = require('./routes/location.routes');
const voucherRoutes = require('./routes/voucher.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/voucher_system'
  }),
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Flash messages
app.use(flash());

// Add user to locals
app.use(addUserToLocals);

// Set view engine
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');

// Routes
app.use('/', userRoutes);
app.use('/', locationRoutes);
app.use('/', voucherRoutes);
app.use('/', adminRoutes);

// Home route
app.get('/', async (req, res) => {
  try {
    const Location = require('./models/location.model');
    const Voucher = require('./models/voucher.model');
    
    // Get featured locations
    const locations = await Location.find()
      .populate('owner', 'username')
      .sort({ createdAt: -1 })
      .limit(6);

    // Get active vouchers
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

// Owner dashboard
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

// Owner locations management
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

// 404 handler
app.use((req, res) => {
  res.status(404).render('pages/404', {
    title: 'Không tìm thấy trang'
  });
});

// Error handler
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
