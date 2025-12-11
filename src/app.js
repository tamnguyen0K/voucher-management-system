/**
 * File: app.js
 * 
 * Mô tả: File khởi tạo ứng dụng Express.js chính
 * - Cấu hình Express server với middleware: session, flash messages, static files, CORS
 * - Kết nối MongoDB qua Mongoose
 * - Đăng ký routes: home, user, location, voucher, admin, owner, chatbot
 * - Xử lý lỗi global (404, 500)
 * - Suppress deprecation warnings từ dependencies
 * 
 * Công nghệ sử dụng:
 * - Express.js: Web framework
 * - Express-session: Quản lý session với MongoDB store
 * - Connect-flash: Flash messages
 * - Express-ejs-layouts: Layout system cho EJS
 * - Mongoose: MongoDB ODM
 * - Connect-mongo: Session store cho MongoDB
 * - Dotenv: Quản lý biến môi trường
 * - CORS: Cross-Origin Resource Sharing
 */

const originalEmitWarning = process.emitWarning;
process.emitWarning = function(warning, ...args) {
  if (typeof warning === 'string' && warning.includes('util.isArray')) return;
  return originalEmitWarning.call(process, warning, ...args);
};

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

const homeRoutes = require('./routes/home.routes');
const userRoutes = require('./routes/user.routes');
const locationRoutes = require('./routes/location.routes');
const voucherRoutes = require('./routes/voucher.routes');
const adminRoutes = require('./routes/admin.routes');
const ownerRoutes = require('./routes/owner.routes');
const chatbotRoutes = require('./routes/chatbot.routes');

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const corsOrigin = process.env.CORS_ALLOW_ORIGIN;
app.use((req, res, next) => {
  if (corsOrigin) res.setHeader('Access-Control-Allow-Origin', corsOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

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
app.locals.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';

app.use('/', homeRoutes);
app.use('/', userRoutes);
app.use('/', locationRoutes);
app.use('/', voucherRoutes);
app.use('/', adminRoutes);
app.use('/owner', ownerRoutes);
app.use('/api', chatbotRoutes);

app.use((req, res) => {
  res.status(404).render('pages/404', { title: 'Không tìm thấy trang' });
});

app.use((error, req, res, next) => {
  const errorMessage = error?.message || 'unknown';
  console.error(`[GlobalError] ${req.method} ${req.originalUrl} | ${errorMessage}`);
  if (error?.stack) console.error(error.stack);
  res.status(500).render('pages/error', {
    title: 'Lỗi hệ thống',
    error: process.env.NODE_ENV === 'development' ? error : {}
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});
