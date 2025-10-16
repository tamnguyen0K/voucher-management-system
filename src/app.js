// =============================
// KHỞI TẠO ỨNG DỤNG NODEJS + EXPRESS
// ============================= 

const express = require('express');                        // Thư viện Express — tạo server, định nghĩa route
const session = require('express-session');                // Dùng để quản lý session (phiên đăng nhập)
const MongoStore = require('connect-mongo');               // Lưu session vào MongoDB thay vì RAM
const path = require('path');                              // Xử lý đường dẫn file/thư mục
const flash = require('connect-flash');                    // Hiển thị thông báo tạm thời (flash message)
const expressLayouts = require('express-ejs-layouts');     // Hỗ trợ layout cho EJS
require('dotenv').config({ path: './src/config/dotenv' }); // Load biến môi trường từ file .env

// Kết nối Database
const connectDB = require('./config/db');
const { addUserToLocals } = require('./middleware/auth');  // Middleware thêm thông tin user vào biến cục bộ cho view

// Import các route
const userRoutes = require('./routes/user.routes');
const locationRoutes = require('./routes/location.routes');
const voucherRoutes = require('./routes/voucher.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;


// =============================
// 1. KẾT NỐI DATABASE
// =============================
  connectDB(); // Gọi hàm connectDB() để kết nối MongoDB

// =============================
// 2. CẤU HÌNH MIDDLEWARE CƠ BẢN
// =============================
  app.use(express.json());                                 // Cho phép đọc dữ liệu JSON trong body request
  app.use(express.urlencoded({ extended: true }));         // Cho phép đọc dữ liệu từ form HTML (x-www-form-urlencoded)
  app.use(express.static(path.join(__dirname, 'public'))); // Cho phép truy cập file tĩnh (CSS, JS, hình ảnh) trong thư mục /public

// =============================
// 3. CẤU HÌNH SESSION
// =============================
  app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here', // Khóa bí mật mã hóa session
  resave: false,              // Không lưu lại session nếu không thay đổi
  saveUninitialized: false,   // Không tạo session trống khi chưa cần
  store: MongoStore.create({
  mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/voucher_system' // Lưu session vào MongoDB
  }),
  cookie: {
  secure: false, // true nếu chạy HTTPS (ở local để false)
  maxAge: 24 * 60 * 60 * 1000 // Thời hạn session: 24 giờ
  }
  }));


// =============================
// 4. FLASH MESSAGE & USER LOCAL
// =============================
  app.use(flash()); // Dùng flash message để hiện thông báo (ví dụ: đăng nhập thành công)
  app.use(addUserToLocals); // Tự động thêm user info vào biến `res.locals.user` cho EJS dùng


// =============================
// 5. CẤU HÌNH VIEW ENGINE (EJS)
// =============================
  app.use(expressLayouts);
  app.set('view engine', 'ejs'); // Sử dụng EJS làm template engine
  app.set('views', path.join(__dirname, 'views')); // Đường dẫn thư mục chứa file EJS
  app.set('layout', 'layout'); // File layout EJS mặc định (layout.ejs)


// =============================
// 6. ĐỊNH NGHĨA ROUTES CHÍNH
// =============================
  app.use('/', userRoutes);
  app.use('/', locationRoutes);
  app.use('/', voucherRoutes);
  app.use('/', adminRoutes);


// =============================
// 7. TRANG CHỦ (HOME PAGE)
// =============================
  app.get('/', async (req, res) => {
  try {
  const Location = require('./models/location.model');
  const Voucher = require('./models/voucher.model');

  // Lấy danh sách 6 địa điểm mới nhất, có thông tin chủ sở hữu
  const locations = await Location.find()
  .populate('owner', 'username')   // Thay userId bằng username
  .sort({ createdAt: -1 })         // Sắp xếp theo thời gian tạo giảm dần
  .limit(6);                       // Giới hạn 6 địa điểm

  // Lấy 6 voucher đang hoạt động (còn số lượng, còn hạn)
  const now = new Date();
  const vouchers = await Voucher.find({
  startDate: { $lte: now },
  endDate: { $gte: now },
  $expr: { $lt: ['$quantityClaimed', '$quantityTotal'] } // chỉ lấy voucher chưa hết số lượng
  })
  .populate('location', 'name imageUrl') // Lấy tên + ảnh của địa điểm gắn với voucher
  .sort({ createdAt: -1 })
  .limit(6);

  // Render giao diện home.ejs và gửi dữ liệu
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


// =============================
// 8. DASHBOARD DÀNH CHO CHỦ (OWNER)
// =============================
  app.get('/owner/dashboard', async (req, res) => {
  try {
  // Kiểm tra quyền: chỉ owner mới truy cập
  if (!req.session.userId || req.session.userRole !== 'owner') {
  req.flash('error', 'Bạn không có quyền truy cập');
  return res.redirect('/');
  }

  const Location = require('./models/location.model');
  const Voucher = require('./models/voucher.model');

  // Lấy các địa điểm mà chủ sở hữu đã tạo
  const locations = await Location.find({ owner: req.session.userId });
  const locationIds = locations.map(loc => loc._id);

  // Lấy các voucher thuộc những địa điểm đó
  const vouchers = await Voucher.find({
  location: { $in: locationIds }
  })
  .populate('location', 'name')
  .sort({ createdAt: -1 });

  // Thống kê dữ liệu
  const totalVouchers = vouchers.length;
  const activeVouchers = vouchers.filter(v => v.status === 'active').length;
  const totalClaims = vouchers.reduce((sum, v) => sum + v.quantityClaimed, 0);

  // Render giao diện dashboard cho owner
  res.render('owner/dashboard', {
  title: 'Owner Dashboard',
  stats: {
  totalLocations: locations.length,
  totalVouchers,
  activeVouchers,
  totalClaims
  },
  locations,
  vouchers: vouchers.slice(0, 5) // hiển thị 5 voucher gần nhất
  });
  } catch (error) {
  console.error('Owner dashboard error:', error);
  req.flash('error', 'Có lỗi xảy ra khi tải dashboard');
  res.redirect('/');
  }
  });


// =============================
// 9. QUẢN LÝ ĐỊA ĐIỂM CHO OWNER
// =============================
  app.get('/owner/locations', async (req, res) => {
  try {
  // Kiểm tra quyền truy cập
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


// =============================
// 10. XỬ LÝ TRANG 404 (KHÔNG TÌM THẤY)
// =============================
  app.use((req, res) => {
  res.status(404).render('pages/404', {
  title: 'Không tìm thấy trang'
  });
  });


// =============================
// 11. XỬ LÝ LỖI TOÀN HỆ THỐNG
// =============================
  app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).render('pages/error', {
  title: 'Lỗi hệ thống',
  error: process.env.NODE_ENV === 'development' ? error : {}
  });
  });


// =============================
// 12. KHỞI ĐỘNG SERVER
// =============================
  app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
  });