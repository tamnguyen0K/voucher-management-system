# Hướng dẫn Setup Chi Tiết

Tài liệu này giúp bạn chuẩn bị môi trường, seed dữ liệu, kiểm tra nhanh các chức năng và xử lý những lỗi phổ biến trước khi bàn giao hoặc triển khai.

---

## 📋 Checklist trước khi bắt đầu
- [ ] Cài Node.js 18+ (kèm npm 9+)
- [ ] Cài MongoDB 6 (local hoặc kết nối Atlas)
- [ ] Git clone được repository
- [ ] Có quyền tạo/thay đổi file trong `D:\Do_an_chuyen_nganh` (Windows cần run CMD/Powershell as Admin)

---

## 1. Cài đặt dependencies
```bash
npm install
```
- Nếu gặp lỗi `node-gyp` hãy chắc chắn đã cài build tools (Windows: `npm install --global windows-build-tools` hoặc Visual Studio Build Tools).

---

## 2. Chuẩn bị MongoDB
### Windows
1. Cài MongoDB Community Server từ https://www.mongodb.com/try/download/community
2. Sau khi cài, mở **Services** và start `MongoDB Server` (hoặc chạy `net start MongoDB`)
3. Tuỳ chọn: cài MongoDB Compass để xem dữ liệu.

### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### Ubuntu/Debian
```bash
# Import key & repo
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install & start
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl enable mongod
sudo systemctl start mongod
```

Xác nhận MongoDB hoạt động:
```bash
mongosh --eval "db.adminCommand('ping')"
```

---

## 3. Cấu hình môi trường (.env)
Tạo file `src/config/.env` với nội dung:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/voucher_system
SESSION_SECRET=your-super-secret-key-here-make-it-long-and-random
```

> Production: thay `NODE_ENV=production`, dùng URI MongoDB Atlas, và đặt `SESSION_SECRET` ngẫu nhiên dài (ít nhất 32 ký tự).

---

## 4. Seed dữ liệu mẫu
```bash
npm run seed
```
Script sẽ xóa dữ liệu cũ trong các collection liên quan rồi tạo:
- 1 admin (admin@example.com / admin123)
- 2 owner (owner1@example.com, owner2@example.com / owner123)
- 2 user (user1@example.com, user2@example.com / user123)
- 6 địa điểm, 6 voucher, 9 review

> Nếu chỉ muốn cập nhật metadata location, dùng `npm run enrich:locations[:dry]`.

---

## 5. Chạy ứng dụng
### Development (auto reload)
```bash
npm run dev
```

### Production local
```bash
npm start
```

Ứng dụng sẽ chạy tại `http://localhost:3000`. Hãy thử:
1. Đăng nhập với các tài khoản seed ở trên
2. Claim 1 voucher với user thường
3. Thêm mới voucher với owner
4. Xoá 1 review với admin

---

## 6. Kiểm thử nhanh theo vai trò
### 👤 User
- Đăng nhập `user1@example.com`
- Duyệt `/locations`, xem chi tiết một địa điểm
- Claim voucher và kiểm tra flash message
- Viết review (kèm upload media nhỏ < 5MB) → kiểm tra review hiển thị

### 🏪 Owner
- Đăng nhập `owner1@example.com`
- Vào `/owner/dashboard`
- Tạo địa điểm mới (đảm bảo mô tả >= `DESCRIPTION_MIN_LENGTH`)
- Thêm voucher cho địa điểm mới tạo
- Kiểm tra bảng thống kê claim/review

### 🛡 Admin
- Đăng nhập `admin@example.com`
- Vào `/admin/dashboard` xem thống kê
- Thử khóa 1 user hoặc xoá review vi phạm
- Đảm bảo RBAC hoạt động: truy cập `/admin/...` khi chưa đăng nhập phải bị chặn

---

## 7. Troubleshooting nhanh
| Lỗi | Nguyên nhân thường gặp | Cách xử lý |
| --- | --- | --- |
| `connect ECONNREFUSED 127.0.0.1:27017` | MongoDB chưa chạy | Start service (`net start MongoDB` / `brew services start ...` / `systemctl start mongod`) |
| `listen EADDRINUSE :::3000` | Port 3000 đã dùng | Đổi `PORT` trong `.env` hoặc kill process (Windows: `netstat -ano | findstr 3000`) |
| `Cannot find module '...``` | Thiếu dependency | Chạy lại `npm install`, xoá `node_modules` nếu cần |
| Multer báo lỗi giới hạn file | File > 15MB hoặc quá 5 file | Giảm kích thước, compress ảnh/video |
| Warning `connect.session() MemoryStore` | session store mặc định | Đã cấu hình connect-mongo, có thể bỏ qua ở dev |

---

## 8. Triển khai thực tế (gợi ý)
1. Build môi trường production (server Ubuntu 22.04 hoặc container)
2. Cài Node.js + MongoDB (hoặc sử dụng Mongo Atlas)
3. Thiết lập biến môi trường hệ thống thay vì file `.env`
4. Chạy `npm install --production`
5. Seed dữ liệu thật hoặc import từ Mongo dump
6. Chạy bằng PM2: `pm2 start src/app.js --name voucher-app`
7. Dùng Nginx reverse proxy + SSL (Let's Encrypt) để phục vụ HTTPS
8. Bật backup định kỳ cho MongoDB và thư mục `src/uploads`

---

## 9. Phụ lục
- `src/config/db.js`: helper kết nối Mongo
- `src/config/migrate.js`: thêm field mới cho user cũ
- `src/config/enrich_locations.js`: chuẩn hóa metadata địa điểm
- `src/middleware/upload.js`: cấu hình Multer (max 5 file, 15MB/file)