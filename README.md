# Voucher Management System

Nền tảng web giúp quản trị voucher và địa điểm ăn uống/giải trí. Ứng dụng monolith Node.js + Express, render giao diện bằng EJS, lưu trữ dữ liệu trên MongoDB và phục vụ ba nhóm người dùng: khách thường, chủ địa điểm và admin.

---

## 📚 Mục lục
1. [Tính năng chính](#-tính-năng-chính)
2. [Kiến trúc & công nghệ](#-kiến-trúc--công-nghệ)
3. [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
4. [Hướng dẫn cài đặt nhanh](#-hướng-dẫn-cài-đặt-nhanh)
5. [.env mẫu & giải thích](#-env-mẫu--giải-thích)
6. [Seed dữ liệu & tài khoản demo](#-seed-dữ-liệu--tài-khoản-demo)
7. [Chạy project & scripts hữu ích](#-chạy-project--scripts-hữu-ích)
8. [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
9. [Luồng người dùng tiêu biểu](#-luồng-người-dùng-tiêu-biểu)
10. [Troubleshooting](#-troubleshooting)
11. [Triển khai production](#-triển-khai-production)
12. [Đóng góp](#-đóng-góp)

---

## 🚀 Tính năng chính

| Nhóm người dùng | Khả năng |
| --- | --- |
| 👤 **User** | Đăng ký/đăng nhập, duyệt địa điểm, xem & claim voucher, viết review kèm media |
| 🏪 **Owner** | Quản lý địa điểm sở hữu, tạo/cập nhật voucher, theo dõi review & lượt claim |
| 🛡 **Admin** | Toàn quyền quản lý user/location/voucher/review, dashboard thống kê, kiểm duyệt nội dung |

Năng lực chung:
- Session-based auth + RBAC (user / owner / admin)
- Review giới hạn 1 review/user/location, hỗ trợ upload media
- Flash message nhất quán, giao diện responsive Bootstrap 5

---

## 🧱 Kiến trúc & công nghệ
- **Backend**: Node.js 18+, Express 4, express-session, connect-mongo, multer
- **Database**: MongoDB 6 (Atlas hoặc local)
- **View layer**: EJS + express-ejs-layouts, Bootstrap 5, Font Awesome
- **Upload**: Multer lưu file vào `src/uploads/reviews/<userId>`
- **Tổ chức mã nguồn**:
  - `controllers/` xử lý business logic từng domain
  - `routes/` gom route theo vai trò/domain
  - `middleware/auth.js` cho RBAC, flash helpers
  - `utils/locationMetadata.js` chuẩn hóa dữ liệu location (menu/price/features)

---

## 🖥 Yêu cầu hệ thống
- Node.js ≥ 18.x
- npm ≥ 9.x
- MongoDB ≥ 6.0 (local hoặc Atlas)
- Git
- Trên Windows: chạy terminal với quyền Admin khi khởi động dịch vụ hoặc thao tác file hệ thống

---

## ⚙️ Hướng dẫn cài đặt nhanh
```bash
# 1. Clone code
git clone <repository-url>
cd voucher-management-system

# 2. Cài dependencies
npm install

# 3. Tạo file môi trường
cp src/config/.env.example src/config/.env  # hoặc tạo thủ công (xem phần .env)

# 4. Khởi động MongoDB
# Windows:  net start MongoDB
# macOS:    brew services start mongodb/brew/mongodb-community
# Ubuntu:   sudo systemctl start mongod

# 5. Seed dữ liệu mẫu
npm run seed

# 6. Khởi chạy
npm run dev   # Dev mode dùng nodemon
# hoặc
npm start     # Production mode
```
Truy cập `http://localhost:3000`.

---

## 🧾 .env mẫu & giải thích
Tạo `src/config/.env`:
```
NODE_ENV=development          # development | production
PORT=3000                     # Cổng Express
MONGODB_URI=mongodb://localhost:27017/voucher_system
SESSION_SECRET=change-me-please-very-long
```
> Gợi ý tạo secret mạnh: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

---

## 🌱 Seed dữ liệu & tài khoản demo
```
npm run seed
```
Script tạo:
- 1 admin (`admin@example.com` / `admin123`)
- 2 owner (`owner1@example.com`, `owner2@example.com` / `owner123`)
- 2 regular user (`user1@example.com`, `user2@example.com` / `user123`)
- 6 địa điểm, 6 voucher, 9 review mẫu

> Lệnh seed sẽ **ghi đè** dữ liệu liên quan, cân nhắc backup trước khi chạy trong môi trường thật.

---

## 🏃‍♂️ Chạy project & scripts hữu ích
| Lệnh | Mô tả |
| --- | --- |
| `npm run dev` | Khởi chạy với nodemon, auto reload khi đổi code |
| `npm start` | Khởi chạy production (node `src/app.js`) |
| `npm run seed` | Ghi dữ liệu mẫu |
| `npm run migrate` | Chạy script migration (ví dụ đồng bộ field user) |
| `npm run enrich:locations` | Chuẩn hóa metadata location hiện có |
| `npm run enrich:locations:dry` | Enrich ở chế độ xem trước (không ghi DB) |

Luôn chắc chắn MongoDB đang chạy trước khi dùng các script thao tác DB.

---

## 📁 Cấu trúc thư mục
```
src/
├── app.js                # Bootstrap Express, mount middleware & routes
├── config/               # db helper, dotenv loader, seed/enrich/migrate scripts
├── controllers/          # Business logic (location, voucher, review, user, owner)
├── middleware/           # auth guards, upload handler
├── models/               # User, Location, Voucher, Review schemas
├── public/               # CSS/JS/static assets
├── routes/               # user/location/voucher/owner/admin router
├── uploads/              # Media upload (gitignored)
├── utils/                # location metadata helper
└── views/                # EJS layout + pages (pages/admin/owner)
```

---

## 🔄 Luồng người dùng tiêu biểu
1. **User**: đăng nhập → duyệt `/locations` → xem chi tiết → claim voucher (`POST /vouchers/:id/claim`) → voucher ghi vào hồ sơ cá nhân.
2. **Owner**: vào `/owner/dashboard` → tạo/cập nhật địa điểm & voucher → theo dõi review/claim thuộc địa điểm của mình.
3. **Admin**: vào `/admin/dashboard` → xem thống kê → quản lý users/locations/vouchers/reviews để duyệt hoặc xử lý vi phạm.

---

## 🛠 Troubleshooting
| Lỗi | Cách khắc phục |
| --- | --- |
| `connect ECONNREFUSED 127.0.0.1:27017` | MongoDB chưa chạy → khởi động service (net start / brew services / systemctl) |
| `listen EADDRINUSE :::3000` | Port 3000 đã dùng → đổi `PORT` trong `.env` hoặc kill process đang chạy |
| `Cannot find module ...` | Thiếu dependency → chạy lại `npm install` |
| Warning `connect.session() MemoryStore` | Chỉ xuất hiện khi dev; production nên dùng Mongo store (app đã config `connect-mongo`) |

---

## ☁️ Triển khai production
- **Build**: monolith Express nên chỉ cần `npm install --production` + `npm start`.
- **Process manager**: dùng PM2 hoặc systemd để tự restart + log rotation.
- **Static assets**: có thể phục vụ qua Express hoặc reverse proxy (Nginx) + cache.
- **Security khuyến nghị**:
  - đặt `SESSION_SECRET` mạnh, bật HTTPS và `cookie.secure=true`
  - khóa port MongoDB, chỉ cho phép app server truy cập
  - backup định kỳ MongoDB và thư mục `src/uploads`
- **Monitoring**: tích hợp logger (Winston/Pino) và central log/metrics nếu triển khai thực tế.

---

## 🤝 Đóng góp
1. Fork repo & tạo branch feature/bugfix.
2. Mô tả rõ issue/feature trong PR.
3. Chạy lại `npm run seed` + smoke test nhanh các flow chính trước khi gửi PR