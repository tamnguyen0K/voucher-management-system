# Voucher Management System

Hệ thống quản lý voucher và địa điểm được xây dựng với Node.js, Express, MongoDB và EJS.

## 🚀 Tính năng

### 👤 Người dùng
- Đăng ký, đăng nhập, đăng xuất
- Xem danh sách địa điểm và voucher đang hoạt động
- Claim voucher (giảm số lượng, thêm vào lịch sử)
- Đánh giá địa điểm (rating + comment)

### 🏪 Chủ quán (Owner)
- Đăng nhập với role = owner
- Quản lý voucher của địa điểm mình sở hữu (CRUD)
- Xem thống kê lượt claim voucher
- Quản lý địa điểm

### 🧰 Admin
- Quản lý tất cả người dùng, voucher, địa điểm, và review
- Xóa, chỉnh sửa nội dung sai phạm
- Dashboard thống kê tổng quan

## 🛠 Công nghệ sử dụng

- **Backend**: Node.js + Express.js
- **Frontend**: EJS template engine + Bootstrap 5
- **Database**: MongoDB (Mongoose)
- **Authentication**: Express-session
- **Styling**: Bootstrap 5 + Custom CSS
- **Icons**: Font Awesome

## 📦 Cài đặt

### Yêu cầu hệ thống
- Node.js (v14 trở lên)
- MongoDB (v4.4 trở lên)
- NPM hoặc Yarn

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd voucher-management-system
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình môi trường
Tạo file `.env` trong thư mục `src/config/` với nội dung:
```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/voucher_system
SESSION_SECRET=your-secret-key-here
```

### Bước 4: Khởi động MongoDB
Đảm bảo MongoDB đang chạy trên máy của bạn:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### Bước 5: Seed dữ liệu mẫu
```bash
npm run seed
```

### Bước 6: Khởi động ứng dụng
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Truy cập ứng dụng tại: `http://localhost:3000`

## 👥 Tài khoản demo

Sau khi chạy seed, bạn có thể sử dụng các tài khoản sau:

### Admin
- **Email**: admin@example.com
- **Password**: admin123

### Owner
- **Email**: owner1@example.com
- **Password**: owner123

### User
- **Email**: user1@example.com
- **Password**: user123

## 📁 Cấu trúc thư mục

```
project/
├── src/
│   ├── models/           # MongoDB models
│   ├── controllers/      # Business logic
│   ├── routes/          # Route handlers
│   ├── views/           # EJS templates
│   │   ├── pages/       # Public pages
│   │   └── admin/       # Admin pages
│   ├── middleware/      # Custom middleware
│   ├── config/          # Configuration files
│   ├── public/          # Static files
│   │   ├── css/
│   │   ├── js/
│   │   └── images/
│   └── app.js           # Main application file
├── package.json
└── README.md
```

## 🗄 Mô hình dữ liệu

### User
- username, email, password
- role: 'user' | 'owner' | 'admin'
- createdAt

### Location
- name, description, address
- type: 'restaurant' | 'cafe' | 'tourist_spot'
- rating, imageUrl
- owner (ref: User)
- createdAt

### Voucher
- code (unique)
- discountPct, quantityTotal, quantityClaimed
- startDate, endDate
- location (ref: Location)
- conditions
- createdAt

### Review
- user (ref: User)
- location (ref: Location)
- rating (1-5), comment
- createdAt

## 🔧 API Endpoints

### Authentication
- `GET /auth` - Login/Register page
- `POST /register` - Register new user
- `POST /login` - Login user
- `POST /logout` - Logout user

### Locations
- `GET /locations` - Get all locations
- `GET /locations/:id` - Get location by ID
- `POST /locations/:id/reviews` - Create review

### Vouchers
- `GET /vouchers` - Get all active vouchers
- `POST /vouchers/:id/claim` - Claim voucher

### Admin
- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/users` - Manage users
- `GET /admin/locations` - Manage locations
- `GET /admin/vouchers` - Manage vouchers
- `GET /admin/reviews` - Manage reviews

### Owner
- `GET /owner/dashboard` - Owner dashboard
- `GET /owner/locations` - Manage own locations
- `GET /owner/vouchers` - Manage own vouchers

## 🎨 Giao diện

- **Responsive design** với Bootstrap 5
- **Modern UI/UX** với custom CSS
- **Interactive elements** với JavaScript
- **Real-time feedback** với flash messages
- **Mobile-friendly** design

## 🔒 Bảo mật

- Password hashing với bcrypt
- Session-based authentication
- Role-based access control
- Input validation và sanitization
- CSRF protection

## 🚀 Deployment

### Heroku
1. Tạo app trên Heroku
2. Cấu hình MongoDB Atlas
3. Set environment variables
4. Deploy code

### VPS/Server
1. Cài đặt Node.js và MongoDB
2. Clone repository
3. Cài đặt dependencies
4. Cấu hình reverse proxy (Nginx)
5. Sử dụng PM2 để quản lý process

## 🧪 Testing

```bash
# Chạy seed để test
npm run seed

# Test các chức năng:
# 1. Đăng ký/đăng nhập
# 2. Claim voucher
# 3. Viết review
# 4. Quản lý admin/owner
```

## 📝 Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server với nodemon
npm run seed       # Seed dữ liệu mẫu
```

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License

## 🆘 Hỗ trợ

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub hoặc liên hệ:
- Email: support@example.com
- GitHub: [Repository Issues](link-to-issues)

---

**Lưu ý**: Đây là project demo, trong môi trường production cần thêm các tính năng bảo mật và tối ưu hóa khác.
