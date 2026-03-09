# BÁO CÁO PHÂN TÍCH TOÀN DIỆN DỰ ÁN NODE.JS/EXPRESS
## Hệ thống Quản lý Voucher và Địa điểm Du lịch

---

## PROMPT 1: PHÂN TÍCH KIẾN TRÚC TỔNG THỂ

### 1.1. Cấu trúc thư mục và thành phần chính

#### Cấu trúc hiện tại:
```
src/
├── app.js                    # Entry point, khởi tạo Express app
├── config/                   # Cấu hình DB, migration, seed
│   ├── db.js
│   ├── migrate.js
│   └── seed.js
├── controllers/             # Business logic layer
│   ├── user.controller.js
│   ├── location.controller.js
│   ├── voucher.controller.js
│   ├── review.controller.js
│   └── owner.controller.js
├── middleware/              # Middleware functions
│   ├── auth.js              # Authentication & authorization
│   └── upload.js            # File upload (Multer)
├── models/                  # Mongoose schemas
│   ├── user.model.js
│   ├── location.model.js
│   ├── voucher.model.js
│   └── review.model.js
├── routes/                  # Route definitions
│   ├── admin.routes.js
│   ├── owner.routes.js
│   ├── user.routes.js
│   ├── location.routes.js
│   ├── voucher.routes.js
│   ├── home.routes.js
│   └── chatbot.routes.js
├── utils/                   # Utility functions
│   └── locationMetadata.js  # Xử lý metadata location
├── views/                   # EJS templates
│   ├── layout.ejs
│   ├── admin/
│   ├── owner/
│   └── pages/
└── public/                  # Static assets
    ├── css/style.css
    └── js/main.js
```

#### Vai trò các thành phần:

**Routes (`src/routes/`):**
- Định nghĩa các endpoint HTTP và mapping đến controller tương ứng
- Áp dụng middleware xác thực (requireAuth, requireAdmin, requireOwner)
- Tổ chức theo domain: admin, owner, user, location, voucher

**Controllers (`src/controllers/`):**
- Xử lý logic nghiệp vụ: validation, query DB, xử lý request/response
- Render views với dữ liệu từ models
- Xử lý lỗi và flash messages

**Models (`src/models/`):**
- Định nghĩa Mongoose schemas với validation
- Pre-save hooks (ví dụ: hash password trong User model)
- Instance methods (ví dụ: comparePassword trong User)
- Virtual fields và indexes

**Middleware (`src/middleware/`):**
- `auth.js`: Xác thực và phân quyền (requireAuth, requireRole, requireAdmin, requireOwner)
- `upload.js`: Cấu hình Multer cho upload file (reviews media)

**Utils (`src/utils/`):**
- `locationMetadata.js`: Xử lý metadata cho location (features, keywords, price level)

### 1.2. Luồng xử lý nghiệp vụ

#### Luồng điển hình (ví dụ: Tạo location mới):

1. **HTTP Request** → `POST /owner/locations`
2. **Route Layer** (`owner.routes.js` hoặc `location.routes.js`):
   - Áp dụng middleware `requireAuth` → kiểm tra đăng nhập
   - Áp dụng middleware `requireOwner` → kiểm tra role
   - Route handler gọi controller: `locationController.createLocation`
3. **Controller Layer** (`location.controller.js`):
   - Validate input từ `req.body`
   - Gọi `validateAndProcessLocationData()` (util function)
   - Tạo instance Location model với dữ liệu đã xử lý
   - Gọi `location.save()` → Mongoose thực thi pre-save hooks nếu có
4. **Model Layer** (`location.model.js`):
   - Mongoose validate schema
   - Lưu vào MongoDB
   - Trả về document đã lưu
5. **Controller tiếp tục**:
   - Set flash message success
   - Redirect về `/owner/locations`
6. **Response** → Client nhận redirect và hiển thị view mới

#### Middleware quan trọng:

**Authentication Middleware (`middleware/auth.js`):**
- `requireAuth`: Kiểm tra session có userId
- `requireRole('owner')`: Kiểm tra role cụ thể
- `addUserToLocals`: Thêm user info vào `res.locals` để dùng trong views

**Upload Middleware (`middleware/upload.js`):**
- Cấu hình Multer cho upload media files (reviews)
- Giới hạn: 5 files, 15MB mỗi file
- Lưu vào `uploads/reviews/{userId}/`

### 1.3. Mẫu thiết kế được sử dụng

#### ✅ MVC Pattern (Model-View-Controller):
- **Model**: Mongoose schemas trong `models/`
- **View**: EJS templates trong `views/`
- **Controller**: Business logic trong `controllers/`

#### ✅ Middleware Pattern:
- Express middleware chain cho authentication, upload, error handling

#### ✅ Repository Pattern (một phần):
- Models đóng vai trò repository, nhưng chưa có lớp service riêng

#### ⚠️ Thiếu Service Layer:
- Controllers gọi trực tiếp Mongoose models
- Logic nghiệp vụ nằm trong controllers, chưa tách riêng

### 1.4. Điểm mạnh của kiến trúc

✅ **Cấu trúc thư mục rõ ràng:**
- Tách biệt routes, controllers, models, middleware, views
- Dễ định vị code theo chức năng

✅ **Phân tách route/controller hợp lý:**
- Routes chỉ định nghĩa endpoint và middleware
- Controllers tập trung xử lý logic

✅ **Sử dụng middleware hiệu quả:**
- Authentication middleware tái sử dụng được
- Upload middleware tập trung

✅ **Mongoose schema tốt:**
- Validation ở schema level
- Pre-save hooks cho logic tự động (hash password)
- Indexes được định nghĩa (text index cho Location)

✅ **Server-side rendering với EJS:**
- Layout system với `express-ejs-layouts`
- Flash messages tích hợp

### 1.5. Điểm yếu và vấn đề

#### ❌ Logic nghiệp vụ trong Controllers:
- Controllers quá dài và làm nhiều việc (ví dụ: `location.controller.js` có hàm `validateAndProcessLocationData` rất dài)
- Thiếu lớp Service để tách logic nghiệp vụ

#### ❌ Code trùng lặp:
- Validation logic lặp lại giữa các controller (ví dụ: kiểm tra user tồn tại)
- Error handling pattern lặp lại: `try/catch` + `req.flash` + `res.redirect`

#### ❌ Fat Controllers:
- Một số controller hàm quá dài (ví dụ: `createLocation`, `updateLocation` có nhiều logic xử lý metadata)

#### ❌ Thiếu xử lý lỗi tập trung:
- Mỗi controller tự xử lý lỗi riêng
- Chưa có error-handling middleware chung

#### ❌ Logic trong Views (một phần):
- Một số logic đơn giản trong EJS (ví dụ: format date, check role)

#### ❌ Naming inconsistency:
- Một số biến dùng camelCase, một số dùng snake_case (ví dụ: `phonenumber` vs `phoneNumber`)

#### ❌ Thiếu abstraction cho DB operations:
- Controllers gọi trực tiếp Mongoose, khó test và thay đổi DB layer sau này

### 1.6. Đề xuất cải thiện kiến trúc

#### 🔧 Tạo Service Layer:
- **Tạo `src/services/`** với các service:
  - `UserService`: Xử lý logic user (register, login, profile)
  - `LocationService`: Xử lý logic location (CRUD, metadata processing)
  - `VoucherService`: Xử lý logic voucher (claim, validation)
  - `ReviewService`: Xử lý logic review (create, validate)

- **Lợi ích**: Controllers gọn hơn, logic nghiệp vụ tái sử dụng được, dễ test

#### 🔧 Tạo Error Handling Middleware:
- **Tạo `middleware/errorHandler.js`**:
  - Bắt tất cả lỗi từ controllers
  - Format error response thống nhất
  - Log lỗi cho monitoring

#### 🔧 Tạo Validation Middleware:
- **Sử dụng `express-validator`** đã có trong dependencies:
  - Tạo validation rules tập trung
  - Tách validation khỏi controller logic

#### 🔧 Tạo Response Helper:
- **Tạo `utils/responseHelper.js`**:
  - Hàm `sendSuccess()`, `sendError()` để chuẩn hóa response
  - Giảm code lặp lại

#### 🔧 Refactor Utils:
- **Tách `locationMetadata.js`** thành các module nhỏ hơn nếu quá lớn
- Tạo `utils/validation.js` cho validation dùng chung

#### 🔧 Tổ chức lại Controllers:
- Controllers chỉ nên: nhận request → gọi service → render response
- Di chuyển logic nghiệp vụ sang services

---

## PROMPT 2: ĐỀ XUẤT REFACTOR MÃ NGUỒN

### 2.1. Code Smell và Nợ kỹ thuật

#### 🔴 Hàm quá dài (Long Method):
- `validateAndProcessLocationData()` trong `location.controller.js` (~40 dòng)
- `register()` trong `user.controller.js` có nhiều logic validation và xử lý

#### 🔴 Code trùng lặp (DRY Violation):
- **Validation pattern lặp lại:**
  ```javascript
  // Pattern này lặp lại trong nhiều controller:
  try {
    // logic
    req.flash('success', '...');
    res.redirect('...');
  } catch (error) {
    console.error('...', error);
    req.flash('error', '...');
    res.redirect('...');
  }
  ```

- **Kiểm tra user tồn tại** lặp lại giữa `register()` và các hàm khác

#### 🔴 Magic Numbers/Strings:
- Hard-coded values: `'user'`, `'owner'`, `'admin'` lặp lại nhiều nơi
- Nên tạo constants: `ROLES.USER`, `ROLES.OWNER`, `ROLES.ADMIN`

#### 🔴 Logic nghiệp vụ trong Controller:
- Controllers chứa quá nhiều logic xử lý dữ liệu
- Ví dụ: `validateAndProcessLocationData()` nên ở service layer

#### 🔴 Inconsistent Error Handling:
- Một số nơi dùng `req.flash`, một số nơi có thể trả JSON
- Chưa có error handling middleware tập trung

#### 🔴 Naming Issues:
- `phonenumber` (snake_case) vs `phoneNumber` (camelCase)
- Một số hàm không rõ nghĩa: `validateRegistration()` có thể đặt tên rõ hơn

### 2.2. Đề xuất giải pháp refactor

#### ✅ 1. Tách hàm dài thành hàm nhỏ:

**Trước:**
```javascript
// location.controller.js
const validateAndProcessLocationData = (name, description, ...) => {
  // 40+ dòng code xử lý
};
```

**Sau:**
```javascript
// services/locationService.js
const normalizeDescription = (text) => { ... };
const validateDescription = (desc) => { ... };
const processFeatures = (features, description) => { ... };
const processPriceInfo = (priceLevel, priceMin, priceMax, desc) => { ... };
const buildKeywords = (locationData) => { ... };

const validateAndProcessLocationData = (data) => {
  const desc = normalizeDescription(data.description);
  validateDescription(desc);
  const features = processFeatures(data.features, desc);
  const priceInfo = processPriceInfo(...);
  const keywords = buildKeywords({...});
  return { description: desc, features, ...priceInfo, keywords };
};
```

**Lợi ích**: Dễ đọc, dễ test từng hàm nhỏ, tái sử dụng được

#### ✅ 2. Tạo Response Helper để loại bỏ code trùng lặp:

**Tạo `utils/responseHelper.js`:**
```javascript
const sendSuccess = (req, res, message, redirectUrl) => {
  req.flash('success', message);
  res.redirect(redirectUrl);
};

const sendError = (req, res, message, redirectUrl) => {
  req.flash('error', message);
  res.redirect(redirectUrl);
};

const sendJsonSuccess = (res, data, message) => {
  res.status(200).json({ success: true, message, data });
};

const sendJsonError = (res, message, statusCode = 400) => {
  res.status(statusCode).json({ success: false, message });
};

module.exports = { sendSuccess, sendError, sendJsonSuccess, sendJsonError };
```

**Sử dụng:**
```javascript
// Trước:
req.flash('success', 'Tạo địa điểm thành công!');
res.redirect('/owner/locations');

// Sau:
sendSuccess(req, res, 'Tạo địa điểm thành công!', '/owner/locations');
```

#### ✅ 3. Tạo Constants cho Magic Values:

**Tạo `constants/roles.js`:**
```javascript
const ROLES = {
  USER: 'user',
  OWNER: 'owner',
  ADMIN: 'admin'
};

const LOCATION_TYPES = {
  RESTAURANT: 'restaurant',
  CAFE: 'cafe',
  TOURIST_SPOT: 'tourist_spot'
};

module.exports = { ROLES, LOCATION_TYPES };
```

**Sử dụng:**
```javascript
// Trước:
if (user.role === 'admin') { ... }

// Sau:
if (user.role === ROLES.ADMIN) { ... }
```

#### ✅ 4. Tạo Service Layer:

**Tạo `services/userService.js`:**
```javascript
const User = require('../models/user.model');

const findUserByEmailOrUsername = async (email, username, phoneNumber) => {
  return User.findOne({
    $or: [
      { email: email.toLowerCase().trim() },
      { username },
      { phoneNumber: phoneNumber.trim() }
    ]
  });
};

const createUser = async (userData) => {
  const user = new User(userData);
  return user.save();
};

module.exports = { findUserByEmailOrUsername, createUser };
```

**Controller sử dụng:**
```javascript
// user.controller.js
const userService = require('../services/userService');

const register = async (req, res) => {
  try {
    // validation...
    const existingUser = await userService.findUserByEmailOrUsername(...);
    if (existingUser) { ... }
    
    const user = await userService.createUser({...});
    sendSuccess(req, res, 'Đăng ký thành công!', '/auth?tab=login');
  } catch (error) {
    handleError(req, res, error, '/auth?tab=register');
  }
};
```

#### ✅ 5. Tạo Error Handling Middleware:

**Tạo `middleware/errorHandler.js`:**
```javascript
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.path}`, err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    req.flash('error', messages.join(', '));
    return res.redirect('back');
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    req.flash('error', 'Thông tin đã tồn tại trong hệ thống');
    return res.redirect('back');
  }
  
  // Default error
  req.flash('error', 'Có lỗi xảy ra. Vui lòng thử lại.');
  res.status(500).render('pages/error', { title: 'Lỗi hệ thống' });
};

module.exports = errorHandler;
```

**Sử dụng trong `app.js`:**
```javascript
const errorHandler = require('./middleware/errorHandler');
// ... routes
app.use(errorHandler); // Đặt cuối cùng
```

#### ✅ 6. Sử dụng express-validator:

**Tạo `validators/userValidator.js`:**
```javascript
const { body, validationResult } = require('express-validator');

const registerValidator = [
  body('username')
    .trim()
    .isLength({ min: 4, max: 20 })
    .matches(/^[A-Za-z0-9_]+$/),
  body('email')
    .isEmail()
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password),
  body('phonenumber')
    .matches(/^[0-9]{9,11}$/)
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.redirect('back');
  }
  next();
};

module.exports = { registerValidator, validate };
```

**Sử dụng trong route:**
```javascript
router.post('/register', registerValidator, validate, userController.register);
```

#### ✅ 7. Cải thiện naming:

**Chuẩn hóa camelCase:**
- `phonenumber` → `phoneNumber` (đã có trong model, cần đồng bộ trong controller)

**Đặt tên hàm rõ nghĩa:**
- `validateRegistration` → `validateRegistrationData` hoặc tách thành `validateEmail`, `validatePassword`, etc.

#### ✅ 8. Loại bỏ code không cần thiết:

- Xóa `console.log` debug trong production code
- Xóa comment cũ không còn đúng
- Kiểm tra và xóa dependencies không dùng

### 2.3. Lợi ích của refactoring

✅ **Code dễ đọc hơn**: Hàm ngắn, tên rõ nghĩa
✅ **Dễ bảo trì**: Logic tập trung, ít trùng lặp
✅ **Dễ test**: Service layer có thể test độc lập
✅ **Tái sử dụng**: Utils và services dùng chung được
✅ **Nhất quán**: Error handling và response format thống nhất

---

## PROMPT 3: TỐI ƯU HIỆU NĂNG DỰ ÁN

### 3.1. Phân tích truy vấn database

#### ⚠️ Vấn đề hiện tại:

**1. Thiếu Indexes:**
- `User.email` có `unique: true` nhưng chưa thấy index explicit
- `Location.owner` (foreign key) chưa có index → query chậm khi filter theo owner
- `Voucher.location` (foreign key) chưa có index
- `Review.user` và `Review.location` chưa có index

**2. Query không tối ưu:**
- Một số query load toàn bộ fields thay vì chỉ fields cần thiết
- Chưa sử dụng `.lean()` khi không cần Mongoose document methods
- Một số query có thể dùng aggregation pipeline hiệu quả hơn

**3. N+1 Query Problem:**
- Ví dụ trong `admin.routes.js`:
  ```javascript
  Location.find().populate('owner', 'username').sort({ createdAt: -1 })
  ```
  Nếu có nhiều locations, mỗi location sẽ query owner riêng

**4. Thiếu Pagination:**
- `getAllLocations()` load tất cả locations cùng lúc
- `admin.routes.js` load tất cả users/locations/vouchers không giới hạn

### 3.2. Đề xuất tối ưu database

#### ✅ 1. Thêm Indexes:

**Trong models:**

```javascript
// user.model.js
userSchema.index({ email: 1 }); // Đã có unique, nhưng explicit index tốt hơn
userSchema.index({ username: 1 });
userSchema.index({ phoneNumber: 1 });

// location.model.js
locationSchema.index({ owner: 1 }); // Foreign key index
locationSchema.index({ type: 1 }); // Filter theo type
locationSchema.index({ createdAt: -1 }); // Sort
locationSchema.index({ city: 1 }); // Filter theo city
// Text index đã có, tốt

// voucher.model.js
voucherSchema.index({ location: 1 }); // Foreign key
voucherSchema.index({ startDate: 1, endDate: 1 }); // Compound index cho query active vouchers
voucherSchema.index({ createdAt: -1 });

// review.model.js
reviewSchema.index({ user: 1 });
reviewSchema.index({ location: 1 });
reviewSchema.index({ createdAt: -1 });
```

#### ✅ 2. Sử dụng `.select()` và `.lean()`:

**Trước:**
```javascript
const locations = await Location.find(query)
  .populate('owner', 'username')
  .sort({ createdAt: -1 });
```

**Sau:**
```javascript
// Chỉ lấy fields cần thiết
const locations = await Location.find(query)
  .select('name description address type rating imageUrl createdAt')
  .populate('owner', 'username')
  .lean() // Trả về plain JS object, nhanh hơn
  .sort({ createdAt: -1 });
```

#### ✅ 3. Thêm Pagination:

**Tạo `utils/pagination.js`:**
```javascript
const paginate = async (Model, query, options = {}) => {
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 10;
  const skip = (page - 1) * limit;
  
  const [data, total] = await Promise.all([
    Model.find(query)
      .skip(skip)
      .limit(limit)
      .lean(),
    Model.countDocuments(query)
  ]);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = { paginate };
```

**Sử dụng:**
```javascript
// location.controller.js
const { paginate } = require('../utils/pagination');

const getAllLocations = async (req, res) => {
  const { type, page = 1 } = req.query;
  const query = type && type !== 'all' ? { type } : {};
  
  const { data: locations, pagination } = await paginate(
    Location,
    query,
    { page, limit: 12 }
  );
  
  res.render('pages/locations', {
    locations,
    pagination,
    currentType: type || 'all'
  });
};
```

#### ✅ 4. Tối ưu Aggregation:

**Trong `admin.routes.js`, thay vì:**
```javascript
const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
const recentLocations = await Location.find().populate('owner', 'username').sort({ createdAt: -1 }).limit(5);
```

**Dùng aggregation:**
```javascript
const recentLocations = await Location.aggregate([
  { $sort: { createdAt: -1 } },
  { $limit: 5 },
  {
    $lookup: {
      from: 'users',
      localField: 'owner',
      foreignField: '_id',
      as: 'owner',
      pipeline: [{ $project: { username: 1 } }]
    }
  },
  { $unwind: '$owner' }
]);
```

### 3.3. Tối ưu Server-side Rendering

#### ✅ 1. Bật View Cache:

**Trong `app.js`:**
```javascript
if (process.env.NODE_ENV === 'production') {
  app.set('view cache', true);
}
```

#### ✅ 2. Thêm Compression Middleware:

**Cài đặt:**
```bash
npm install compression
```

**Sử dụng trong `app.js`:**
```javascript
const compression = require('compression');
app.use(compression()); // Nén gzip response
```

### 3.4. Tối ưu xử lý bất đồng bộ

#### ⚠️ Vấn đề:
- Một số nơi có thể dùng `bcrypt.hashSync` (blocking) thay vì `bcrypt.hash` (async)
- File upload có thể block nếu file lớn

#### ✅ Giải pháp:
- Đảm bảo tất cả I/O operations đều async
- Xử lý file upload trong background nếu cần

### 3.5. Caching

#### ✅ 1. Cache cho dữ liệu ít thay đổi:

**Cài đặt Redis (nếu có):**
```bash
npm install redis
```

**Tạo `utils/cache.js`:**
```javascript
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

const getCache = async (key) => {
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
};

const setCache = async (key, data, ttl = 300) => {
  await client.setEx(key, ttl, JSON.stringify(data));
};

module.exports = { getCache, setCache };
```

**Sử dụng:**
```javascript
// location.controller.js
const getAllLocations = async (req, res) => {
  const cacheKey = `locations:${req.query.type || 'all'}`;
  let locations = await getCache(cacheKey);
  
  if (!locations) {
    locations = await Location.find(query).lean();
    await setCache(cacheKey, locations, 300); // Cache 5 phút
  }
  
  res.render('pages/locations', { locations });
};
```

#### ✅ 2. Cache cho stats (admin dashboard):

```javascript
// admin.routes.js
const getDashboardStats = async () => {
  const cacheKey = 'admin:dashboard:stats';
  let stats = await getCache(cacheKey);
  
  if (!stats) {
    stats = await calculateStats(); // Expensive operation
    await setCache(cacheKey, stats, 60); // Cache 1 phút
  }
  
  return stats;
};
```

### 3.6. Tối ưu Background Jobs

#### ✅ Tách công việc nặng ra khỏi request:

**Ví dụ: Gửi email xác nhận:**
- Hiện tại: Gửi email trong request → user phải đợi
- Sau: Đưa vào queue (Bull/Agenda) → response ngay, xử lý sau

### 3.7. Monitoring và Benchmarking

#### ✅ Thêm logging thời gian xử lý:

```javascript
// middleware/performanceLogger.js
const performanceLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 1000) { // Log nếu > 1s
      console.warn(`[Slow Request] ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  next();
};
```

### 3.8. Tóm tắt đề xuất tối ưu

**Ưu tiên cao:**
1. ✅ Thêm indexes cho foreign keys và fields thường query
2. ✅ Thêm pagination cho danh sách
3. ✅ Sử dụng `.lean()` và `.select()` khi không cần Mongoose methods
4. ✅ Bật compression middleware

**Ưu tiên trung bình:**
5. ✅ Cache cho dữ liệu ít thay đổi (stats, locations list)
6. ✅ Tối ưu aggregation queries

**Ưu tiên thấp:**
7. ✅ Background jobs cho tasks nặng
8. ✅ Performance monitoring

---

## PROMPT 4: TƯ VẤN BẢO MẬT EXPRESS

### 4.1. Sử dụng Helmet

#### ✅ Cài đặt và cấu hình:

```bash
npm install helmet
```

**Trong `app.js`:**
```javascript
const helmet = require('helmet');
app.use(helmet());

// Hoặc cấu hình chi tiết:
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

**Lợi ích:**
- Tự động set các security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Chống XSS, clickjacking

### 4.2. Ẩn thông tin server

#### ✅ Disable X-Powered-By:

**Trong `app.js`:**
```javascript
app.disable('x-powered-by');
```

### 4.3. Cấu hình Cookie an toàn

#### ✅ Cập nhật session config:

**Trong `app.js`:**
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  name: 'voucherSystem.sid', // Đổi tên cookie
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only trong production
    httpOnly: true, // JS không đọc được
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax' // Chống CSRF
  }
}));

// Nếu deploy sau proxy (Heroku, Nginx)
app.set('trust proxy', 1);
```

### 4.4. Rate Limiting

#### ✅ Cài đặt express-rate-limit:

```bash
npm install express-rate-limit
```

**Tạo `middleware/rateLimiter.js`:**
```javascript
const rateLimit = require('express-rate-limit');

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100 // 100 requests per window
});

// Strict limiter cho login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 lần đăng nhập mỗi 15 phút
  message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, loginLimiter };
```

**Sử dụng:**
```javascript
// app.js
const { generalLimiter, loginLimiter } = require('./middleware/rateLimiter');
app.use(generalLimiter);

// user.routes.js
router.post('/login', loginLimiter, userController.login);
```

### 4.5. CORS Configuration

#### ✅ Cấu hình CORS (nếu cần API):

**Hiện tại đã có CORS cơ bản trong `app.js`, nhưng nên cải thiện:**

```javascript
const cors = require('cors');

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### 4.6. Validation và Sanitization

#### ✅ Sử dụng express-validator (đã có):

**Tạo `validators/sanitizers.js`:**
```javascript
const { body } = require('express-validator');

const sanitizeInput = [
  body('username').trim().escape(),
  body('email').normalizeEmail(),
  body('description').trim().escape(),
];
```

**Chống XSS trong EJS:**
- Đảm bảo dùng `<%= %>` (escape) thay vì `<%- %>` (raw) khi render user input

### 4.7. Chống NoSQL Injection

#### ✅ Sanitize MongoDB queries:

**Cài đặt:**
```bash
npm install express-mongo-sanitize
```

**Sử dụng:**
```javascript
const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize()); // Loại bỏ $ và . khỏi req.body, req.query
```

### 4.8. CSRF Protection

#### ✅ Cài đặt csurf:

```bash
npm install csurf
```

**Tạo `middleware/csrf.js`:**
```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Helper để thêm token vào locals
const addCsrfToken = (req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
};

module.exports = { csrfProtection, addCsrfToken };
```

**Sử dụng:**
```javascript
// app.js
const { csrfProtection, addCsrfToken } = require('./middleware/csrf');
app.use(csrfProtection);
app.use(addCsrfToken);

// Trong form EJS:
// <input type="hidden" name="_csrf" value="<%= csrfToken %>">
```

**Lưu ý:** Cần thêm token vào tất cả forms POST

### 4.9. Kiểm tra phân quyền

#### ✅ Đảm bảo middleware auth đúng:

**Kiểm tra `middleware/auth.js`:**
- ✅ Đã có `requireAuth`, `requireAdmin`, `requireOwner`
- ⚠️ Cần đảm bảo tất cả routes nhạy cảm đều có middleware

**Audit routes:**
```javascript
// Đảm bảo các route này có middleware:
// - /admin/* → requireAdmin
// - /owner/* → requireOwner
// - POST /vouchers/:id/claim → requireAuth
```

### 4.10. Cập nhật Dependencies

#### ✅ Chạy npm audit:

```bash
npm audit
npm audit fix
```

**Kiểm tra định kỳ:**
- Cập nhật Express, Mongoose lên phiên bản mới nhất ổn định
- Xóa dependencies không dùng

### 4.11. Logging an toàn

#### ✅ Không log thông tin nhạy cảm:

```javascript
// ❌ Không làm:
console.log('User password:', user.password);

// ✅ Làm:
console.log('User login attempt:', { userId: user._id, email: user.email });
```

### 4.12. Tóm tắt đề xuất bảo mật

**Ưu tiên cao (làm ngay):**
1. ✅ Cài Helmet
2. ✅ Disable X-Powered-By
3. ✅ Cấu hình cookie secure (httpOnly, sameSite)
4. ✅ Rate limiting cho login
5. ✅ express-mongo-sanitize

**Ưu tiên trung bình:**
6. ✅ CSRF protection (cần sửa forms)
7. ✅ Validation với express-validator
8. ✅ Audit dependencies

**Ưu tiên thấp:**
9. ✅ CORS chi tiết (nếu cần API)
10. ✅ Security logging

---

## PROMPT 5: VIẾT TEST TỰ ĐỘNG (JEST + SUPERTEST)

### 5.1. Thiết lập môi trường test

#### ✅ Cài đặt dependencies:

```bash
npm install --save-dev jest supertest mongodb-memory-server
```

#### ✅ Cấu hình Jest:

**Tạo `jest.config.js`:**
```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/config/**',
    '!src/app.js'
  ]
};
```

**Cập nhật `package.json`:**
```json
{
  "scripts": {
    "test": "jest --runInBand",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

#### ✅ Setup test database:

**Tạo `tests/setup.js`:**
```javascript
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

### 5.2. Test Strategy

#### Unit Tests:
- Test các hàm util độc lập
- Test model methods (ví dụ: `comparePassword`)

#### Integration Tests:
- Test API endpoints với Supertest
- Test luồng đầy đủ: route → controller → model → DB

### 5.3. Ví dụ Test Cases

#### ✅ Test 1: User Registration

**Tạo `__tests__/user.test.js`:**
```javascript
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');

describe('POST /register', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        phonenumber: '0123456789',
        role: 'user'
      });

    expect(res.statusCode).toBe(302); // Redirect
    expect(res.headers.location).toContain('/auth?tab=login');

    // Verify user created in DB
    const user = await User.findOne({ email: 'test@example.com' });
    expect(user).toBeTruthy();
    expect(user.username).toBe('testuser');
    expect(user.role).toBe('user');
  });

  it('should reject registration with duplicate email', async () => {
    // Create existing user
    await User.create({
      username: 'existing',
      email: 'existing@example.com',
      password: 'password123',
      phoneNumber: '0987654321',
      role: 'user'
    });

    const res = await request(app)
      .post('/register')
      .send({
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        phonenumber: '0123456789'
      });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toContain('/auth?tab=register');
  });

  it('should reject registration with invalid password', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: '123', // Too short
        confirmPassword: '123',
        phonenumber: '0123456789'
      });

    expect(res.statusCode).toBe(302);
  });
});
```

#### ✅ Test 2: User Login

```javascript
describe('POST /login', () => {
  beforeEach(async () => {
    await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      phoneNumber: '0123456789',
      role: 'user'
    });
  });

  it('should login successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res.statusCode).toBe(302);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toContain('/auth?tab=login');
  });
});
```

#### ✅ Test 3: Protected Routes

```javascript
describe('GET /admin/dashboard', () => {
  it('should redirect to login if not authenticated', async () => {
    const res = await request(app)
      .get('/admin/dashboard');

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toContain('/auth');
  });

  it('should allow access for admin user', async () => {
    const user = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
      phoneNumber: '0123456789',
      role: 'admin'
    });

    const agent = request.agent(app);
    await agent.post('/login').send({
      email: 'admin@example.com',
      password: 'password123'
    });

    const res = await agent.get('/admin/dashboard');
    expect(res.statusCode).toBe(200);
  });
});
```

#### ✅ Test 4: Location CRUD

```javascript
describe('Location API', () => {
  let ownerId;
  let authCookie;

  beforeEach(async () => {
    const owner = await User.create({
      username: 'owner',
      email: 'owner@example.com',
      password: 'password123',
      phoneNumber: '0123456789',
      role: 'owner'
    });
    ownerId = owner._id;

    const agent = request.agent(app);
    await agent.post('/login').send({
      email: 'owner@example.com',
      password: 'password123'
    });
    authCookie = agent.cookies;
  });

  it('should create a new location', async () => {
    const res = await request(app)
      .post('/owner/locations')
      .set('Cookie', authCookie)
      .send({
        name: 'Test Location',
        description: 'A test location description that is long enough',
        address: '123 Test St',
        type: 'restaurant',
        city: 'Ho Chi Minh City',
        priceLevel: 'standard'
      });

    expect(res.statusCode).toBe(302);

    const location = await Location.findOne({ name: 'Test Location' });
    expect(location).toBeTruthy();
    expect(location.owner.toString()).toBe(ownerId.toString());
  });
});
```

#### ✅ Test 5: Model Methods

```javascript
describe('User Model', () => {
  it('should hash password before saving', async () => {
    const user = new User({
      username: 'test',
      email: 'test@example.com',
      password: 'plainpassword',
      phoneNumber: '0123456789'
    });

    await user.save();

    expect(user.password).not.toBe('plainpassword');
    expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt hash format
  });

  it('should compare password correctly', async () => {
    const user = new User({
      username: 'test',
      email: 'test@example.com',
      password: 'plainpassword',
      phoneNumber: '0123456789'
    });

    await user.save();

    const isMatch = await user.comparePassword('plainpassword');
    expect(isMatch).toBe(true);

    const isWrong = await user.comparePassword('wrongpassword');
    expect(isWrong).toBe(false);
  });
});
```

### 5.4. Test Coverage Goals

**Mục tiêu coverage:**
- Controllers: 80%+
- Models: 90%+
- Utils: 85%+
- Routes: 70%+ (chủ yếu integration tests)

### 5.5. Chạy Tests

```bash
# Chạy tất cả tests
npm test

# Chạy với watch mode
npm run test:watch

# Chạy với coverage report
npm run test:coverage
```

---

## PROMPT 6: THỨ TỰ ƯU TIÊN THỰC HIỆN THAY ĐỔI

### 6.1. Lộ trình thực hiện

#### GIAI ĐOẠN 1: Phân tích & Lên kế hoạch (1-2 ngày)

**Mục tiêu:** Hiểu rõ hiện trạng, không thay đổi code

**Công việc:**
1. ✅ Đọc và phân tích toàn bộ codebase (ĐÃ HOÀN THÀNH)
2. ✅ Xác định các điểm cần cải thiện (theo 5 prompt trên)
3. ✅ Ước lượng effort cho từng hạng mục
4. ✅ Lên danh sách công việc chi tiết

**Kết quả:** Document phân tích kiến trúc (Prompt 1)

---

#### GIAI ĐOẠN 2: Viết Test Hiện Trạng (Ưu tiên #1) (3-5 ngày)

**Mục tiêu:** Tạo lưới an toàn trước khi refactor

**Công việc:**

**Bước 2.1: Setup test environment (1 ngày)**
- ✅ Cài đặt Jest, Supertest, mongodb-memory-server
- ✅ Cấu hình Jest
- ✅ Tạo test setup/teardown

**Bước 2.2: Viết test cho chức năng core (2-3 ngày)**
- ✅ Test user registration/login
- ✅ Test location CRUD
- ✅ Test voucher claim
- ✅ Test review creation
- ✅ Test authentication middleware

**Bước 2.3: Viết test cho admin/owner routes (1 ngày)**
- ✅ Test admin dashboard
- ✅ Test owner dashboard
- ✅ Test protected routes

**Kết quả:** Bộ test tự động với coverage ~70% cho các chức năng chính

**Lưu ý:** Nếu phát hiện bug khi viết test, có thể sửa nhẹ để test pass, nhưng không refactor lớn ở giai đoạn này.

---

#### GIAI ĐOẠN 3: Refactor Code Tịnh Tiến (5-7 ngày)

**Mục tiêu:** Code sạch hơn, dễ bảo trì hơn

**Thứ tự refactor:**

**Bước 3.1: Cleanup cơ bản (1 ngày)**
- ✅ Xóa code dư thừa, comment cũ
- ✅ Format code nhất quán
- ✅ Đổi tên biến cho nhất quán (phonenumber → phoneNumber)
- ✅ Chạy test sau mỗi thay đổi

**Bước 3.2: Tạo Constants và Helpers (1 ngày)**
- ✅ Tạo `constants/roles.js`
- ✅ Tạo `utils/responseHelper.js`
- ✅ Refactor code sử dụng constants/helpers
- ✅ Chạy test

**Bước 3.3: Refactor code trùng lặp (1-2 ngày)**
- ✅ Tạo error handling middleware
- ✅ Thay thế error handling pattern lặp lại bằng middleware
- ✅ Tạo validation helpers nếu cần
- ✅ Chạy test sau mỗi thay đổi

**Bước 3.4: Tách hàm dài (1 ngày)**
- ✅ Refactor `validateAndProcessLocationData()` thành các hàm nhỏ
- ✅ Refactor các hàm controller dài khác
- ✅ Chạy test

**Bước 3.5: Tạo Service Layer (2-3 ngày)**
- ✅ Tạo `services/userService.js`
- ✅ Tạo `services/locationService.js`
- ✅ Tạo `services/voucherService.js`
- ✅ Refactor controllers để sử dụng services
- ✅ Chạy test sau mỗi service

**Kết quả:** Code gọn gàng hơn, dễ đọc, dễ test, ít trùng lặp

---

#### GIAI ĐOẠN 4: Tối Ưu Hiệu Năng (3-4 ngày)

**Mục tiêu:** Ứng dụng chạy nhanh hơn, chịu tải tốt hơn

**Thứ tự tối ưu:**

**Bước 4.1: Tối ưu Database (2 ngày)**
- ✅ Thêm indexes cho foreign keys và fields thường query
- ✅ Thêm pagination cho danh sách
- ✅ Sử dụng `.lean()` và `.select()` trong queries
- ✅ Tối ưu aggregation queries
- ✅ Chạy test để đảm bảo kết quả không đổi
- ✅ Benchmark để đo cải thiện

**Bước 4.2: Tối ưu Rendering (1 ngày)**
- ✅ Bật view cache trong production
- ✅ Thêm compression middleware
- ✅ Kiểm tra performance

**Bước 4.3: Caching (1 ngày - tùy chọn)**
- ✅ Implement caching cho stats (nếu có Redis)
- ✅ Cache locations list
- ✅ Test cache invalidation

**Kết quả:** Query nhanh hơn, response time giảm, có thể chịu tải cao hơn

---

#### GIAI ĐOẠN 5: Tăng Cường Bảo Mật (2-3 ngày)

**Mục tiêu:** Ứng dụng an toàn hơn

**Thứ tự:**

**Bước 5.1: Security Headers (0.5 ngày)**
- ✅ Cài và cấu hình Helmet
- ✅ Disable X-Powered-By
- ✅ Test không ảnh hưởng functionality

**Bước 5.2: Cookie Security (0.5 ngày)**
- ✅ Cấu hình cookie secure, httpOnly, sameSite
- ✅ Đổi tên cookie
- ✅ Test login/logout vẫn hoạt động

**Bước 5.3: Rate Limiting (0.5 ngày)**
- ✅ Thêm rate limiter cho login
- ✅ Thêm general rate limiter
- ✅ Test giới hạn hoạt động

**Bước 5.4: Input Sanitization (0.5 ngày)**
- ✅ Cài express-mongo-sanitize
- ✅ Sử dụng express-validator cho validation
- ✅ Test các trường hợp injection

**Bước 5.5: CSRF Protection (1 ngày - tùy chọn)**
- ✅ Cài csurf
- ✅ Thêm CSRF token vào forms
- ✅ Update tests để include CSRF token
- ⚠️ Cần cẩn thận, có thể làm sau

**Bước 5.6: Dependency Audit (0.5 ngày)**
- ✅ Chạy npm audit
- ✅ Cập nhật dependencies có lỗ hổng

**Kết quả:** Ứng dụng tuân thủ security best practices

---

#### GIAI ĐOẠN 6: Kiểm Thử Tổng Thể & Triển Khai (1-2 ngày)

**Mục tiêu:** Đảm bảo mọi thứ hoạt động đúng

**Công việc:**

**Bước 6.1: Chạy toàn bộ test suite**
- ✅ Tất cả tests phải pass
- ✅ Kiểm tra coverage report

**Bước 6.2: Manual testing**
- ✅ Test các luồng chính:
  - Đăng ký/đăng nhập
  - Tạo/sửa/xóa location
  - Tạo/sửa/xóa voucher
  - Claim voucher
  - Tạo review
  - Admin/owner dashboards

**Bước 6.3: Performance testing**
- ✅ Kiểm tra response time
- ✅ Kiểm tra với dữ liệu lớn

**Bước 6.4: Security testing**
- ✅ Kiểm tra các biện pháp bảo mật hoạt động
- ✅ Test rate limiting
- ✅ Test authentication/authorization

**Bước 6.5: Deployment**
- ✅ Deploy lên staging environment
- ✅ Test trên staging
- ✅ Deploy lên production (từng bước nếu có thể)

---

### 6.2. Timeline Tổng Quan

| Giai đoạn | Thời gian | Ưu tiên | Phụ thuộc |
|-----------|-----------|---------|-----------|
| 1. Phân tích | 1-2 ngày | Cao | - |
| 2. Viết Test | 3-5 ngày | **Cao nhất** | Giai đoạn 1 |
| 3. Refactor | 5-7 ngày | Cao | Giai đoạn 2 |
| 4. Tối ưu | 3-4 ngày | Trung bình | Giai đoạn 3 |
| 5. Bảo mật | 2-3 ngày | Trung bình | Giai đoạn 3 |
| 6. Test & Deploy | 1-2 ngày | Cao | Tất cả |

**Tổng thời gian ước tính:** 15-23 ngày làm việc

---

### 6.3. Nguyên Tắc Thực Hiện

#### ✅ Small Incremental Changes:
- Mỗi lần chỉ thay đổi một phần nhỏ
- Commit thường xuyên với message rõ ràng
- Dễ rollback nếu có vấn đề

#### ✅ Test After Each Change:
- Chạy test sau mỗi thay đổi
- Nếu test fail, sửa ngay hoặc rollback

#### ✅ Git Workflow:
- Tạo branch riêng cho mỗi giai đoạn
- Merge vào main sau khi test pass

#### ✅ Documentation:
- Cập nhật README với các thay đổi
- Document các patterns mới (service layer, etc.)

---

### 6.4. Rủi Ro và Cách Xử Lý

#### ⚠️ Rủi ro: Test fail sau refactor
**Giải pháp:** Xem lại thay đổi, đảm bảo logic không đổi, sửa test nếu cần

#### ⚠️ Rủi ro: Performance regression
**Giải pháp:** Benchmark trước/sau, rollback nếu chậm hơn

#### ⚠️ Rủi ro: Security issue phát hiện sớm
**Giải pháp:** Hotfix ngay, sau đó làm bài bản theo kế hoạch

#### ⚠️ Rủi ro: Conflict khi làm song song
**Giải pháp:** Phân công rõ ràng, communicate thường xuyên

---

### 6.5. Checklist Tổng Hợp

#### Trước khi bắt đầu:
- [ ] Backup codebase hiện tại
- [ ] Setup development environment
- [ ] Đọc và hiểu toàn bộ codebase

#### Sau mỗi giai đoạn:
- [ ] Tất cả tests pass
- [ ] Code review (nếu có team)
- [ ] Update documentation
- [ ] Commit và tag version

#### Trước khi deploy:
- [ ] Tất cả tests pass
- [ ] Manual testing hoàn tất
- [ ] Performance acceptable
- [ ] Security audit pass
- [ ] Documentation updated

---

## KẾT LUẬN

Báo cáo này đã phân tích toàn diện dự án Node.js/Express theo 6 khía cạnh:

1. ✅ **Kiến trúc**: Xác định điểm mạnh/yếu, đề xuất cải thiện
2. ✅ **Refactoring**: Đề xuất cách làm code sạch hơn
3. ✅ **Performance**: Tối ưu database, rendering, caching
4. ✅ **Security**: Bảo mật theo best practices
5. ✅ **Testing**: Thiết lập test tự động
6. ✅ **Roadmap**: Lộ trình thực hiện có thứ tự ưu tiên

**Lưu ý quan trọng:**
- Luôn viết test trước khi refactor
- Thay đổi từng bước nhỏ, test thường xuyên
- Ưu tiên an toàn và ổn định hơn tốc độ
- Document mọi thay đổi quan trọng

Chúc dự án thành công! 🚀

