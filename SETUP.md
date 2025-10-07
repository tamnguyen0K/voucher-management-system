# Hướng dẫn Setup và Chạy Project

## 🚀 Bước 1: Cài đặt Dependencies

```bash
npm install
```

## 🗄️ Bước 2: Cài đặt MongoDB

### Windows:
1. Tải MongoDB Community Server từ: https://www.mongodb.com/try/download/community
2. Cài đặt và khởi động MongoDB service
3. Hoặc sử dụng MongoDB Compass (GUI)

### macOS:
```bash
# Sử dụng Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### Ubuntu/Debian:
```bash
# Import public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## ⚙️ Bước 3: Cấu hình Environment

Tạo file `.env` trong thư mục `src/config/`:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/voucher_system
SESSION_SECRET=your-super-secret-key-here-make-it-long-and-random
```

## 🌱 Bước 4: Seed Dữ liệu mẫu

```bash
npm run seed
```

Lệnh này sẽ tạo:
- 1 admin user
- 2 owner users  
- 2 regular users
- 6 địa điểm mẫu
- 6 voucher mẫu
- 9 review mẫu

## ▶️ Bước 5: Chạy ứng dụng

### Development mode (với auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

## 🌐 Bước 6: Truy cập ứng dụng

Mở trình duyệt và truy cập: `http://localhost:3000`

## 👥 Tài khoản demo

Sau khi chạy seed, bạn có thể đăng nhập với:

### 🔑 Admin
- **Email**: admin@example.com
- **Password**: admin123
- **Quyền**: Quản lý toàn bộ hệ thống

### 🏪 Owner 1
- **Email**: owner1@example.com  
- **Password**: owner123
- **Quyền**: Quản lý địa điểm và voucher của mình

### 🏪 Owner 2
- **Email**: owner2@example.com
- **Password**: owner123
- **Quyền**: Quản lý địa điểm và voucher của mình

### 👤 User 1
- **Email**: user1@example.com
- **Password**: user123
- **Quyền**: Xem địa điểm, claim voucher, viết review

### 👤 User 2
- **Email**: user2@example.com
- **Password**: user123
- **Quyền**: Xem địa điểm, claim voucher, viết review

## 🧪 Test các chức năng

### 1. Test User thường:
- Đăng nhập với user1@example.com
- Xem danh sách địa điểm
- Claim một voucher
- Viết review cho địa điểm
- Xem profile cá nhân

### 2. Test Owner:
- Đăng nhập với owner1@example.com
- Xem dashboard owner
- Tạo địa điểm mới
- Tạo voucher cho địa điểm
- Quản lý voucher

### 3. Test Admin:
- Đăng nhập với admin@example.com
- Xem dashboard admin với thống kê
- Quản lý users, locations, vouchers, reviews
- Thay đổi role của user
- Xóa nội dung không phù hợp

## 🔧 Troubleshooting

### Lỗi kết nối MongoDB:
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Giải pháp**: Đảm bảo MongoDB đang chạy
- Windows: `net start MongoDB`
- macOS: `brew services start mongodb/brew/mongodb-community`
- Linux: `sudo systemctl start mongod`

### Lỗi Port đã được sử dụng:
```
Error: listen EADDRINUSE :::3000
```
**Giải pháp**: 
- Thay đổi PORT trong file `.env`
- Hoặc kill process đang sử dụng port 3000

### Lỗi Module không tìm thấy:
```
Cannot find module 'connect-flash'
```
**Giải pháp**: Chạy lại `npm install`

### Lỗi Session:
```
Warning: connect.session() MemoryStore is not designed for production
```
**Giải pháp**: Đây chỉ là warning, không ảnh hưởng đến development

## 📁 Cấu trúc Project sau khi setup

```
project/
├── src/
│   ├── models/          ✅ User, Location, Voucher, Review models
│   ├── controllers/     ✅ Business logic controllers  
│   ├── routes/          ✅ API routes
│   ├── views/           ✅ EJS templates
│   ├── middleware/      ✅ Authentication middleware
│   ├── config/          ✅ Database config + seed script
│   ├── public/          ✅ Static files (CSS, JS, images)
│   └── app.js           ✅ Main application
├── package.json         ✅ Dependencies
├── README.md            ✅ Documentation
└── SETUP.md             ✅ This file
```

## 🎯 Chức năng đã hoàn thành

✅ **Authentication System**
- Đăng ký, đăng nhập, đăng xuất
- Session-based authentication
- Role-based access control (user/owner/admin)

✅ **Location Management**
- CRUD operations cho địa điểm
- Hình ảnh và mô tả
- Phân loại (restaurant/cafe/tourist_spot)
- Rating system

✅ **Voucher System**
- Tạo voucher với mã code unique
- Giảm giá theo phần trăm
- Giới hạn số lượng và thời gian
- Claim voucher functionality
- Thống kê usage

✅ **Review System**
- Rating 1-5 sao
- Comment system
- Một user chỉ review 1 lần per location
- Auto-update location rating

✅ **Admin Panel**
- Dashboard với thống kê
- Quản lý users, locations, vouchers, reviews
- Thay đổi user roles
- Xóa nội dung không phù hợp

✅ **Owner Panel**
- Dashboard riêng cho owner
- Quản lý địa điểm và voucher của mình
- Thống kê claim voucher

✅ **Responsive UI**
- Bootstrap 5 design
- Mobile-friendly
- Modern UI/UX
- Flash messages
- Interactive elements

## 🚀 Sẵn sàng sử dụng!

Project đã hoàn chỉnh và sẵn sàng để test. Bạn có thể:
1. Chạy `npm run dev` để start development server
2. Truy cập http://localhost:3000
3. Đăng nhập với các tài khoản demo
4. Test tất cả các chức năng

Chúc bạn coding vui vẻ! 🎉
