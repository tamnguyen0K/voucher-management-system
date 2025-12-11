# Kiểm tra và xử lý vấn đề encoding với dữ liệu tiếng Việt

## Vấn đề

Khi import dữ liệu từ folder `data` (tiếng Anh) thì project hoạt động bình thường, nhưng khi import từ folder `new_data` (tiếng Việt) thì project không hoạt động.

## Nguyên nhân có thể

1. **Encoding của file JSON**: File JSON cần được lưu với encoding UTF-8
2. **MongoDB import tool**: `mongoimport` cần được cấu hình đúng encoding
3. **Node.js đọc file**: Cần đảm bảo đọc file với encoding UTF-8
4. **MongoDB connection**: Cần đảm bảo connection string hỗ trợ UTF-8

## Giải pháp

### 1. Kiểm tra encoding của file

```bash
# Windows PowerShell
Get-Content new_data/voucher_system.locations.json -Encoding UTF8 | Select-Object -First 1

# Linux/Mac
file -bi new_data/voucher_system.locations.json
```

### 2. Import dữ liệu với script

```bash
# Import từ folder data (tiếng Anh)
node import_data.js data

# Import từ folder new_data (tiếng Việt)
node import_data.js new_data
```

### 3. Kiểm tra dữ liệu trong MongoDB

```bash
# Kết nối MongoDB
mongo "mongodb://localhost:27017/voucher_system"

# Hoặc nếu dùng MongoDB Compass, kết nối và kiểm tra
# Xem các document trong collection locations, vouchers, reviews
```

### 4. Kiểm tra trong code

Đảm bảo tất cả các file đọc JSON đều dùng encoding UTF-8:

```javascript
const data = fs.readFileSync('path/to/file.json', 'utf8');
const json = JSON.parse(data);
```

## Script import_data.js

Script này:
- ✅ Đọc file với encoding UTF-8
- ✅ Sử dụng `mongoimport` với flag `--jsonArray`
- ✅ Tự động drop collection cũ trước khi import (--drop)
- ✅ Hỗ trợ cả MongoDB local và MongoDB Atlas
- ✅ Hiển thị thông báo rõ ràng về quá trình import

## Lưu ý

1. **MongoDB Tools**: Cần cài đặt MongoDB Database Tools để sử dụng `mongoimport`
   - Windows: https://www.mongodb.com/try/download/database-tools
   - Linux/Mac: `brew install mongodb-database-tools` hoặc tải từ MongoDB website

2. **File format**: File JSON phải là mảng (array) để dùng flag `--jsonArray`

3. **Encoding**: Tất cả file JSON phải được lưu với encoding UTF-8 (không phải UTF-8 BOM)

## Kiểm tra nhanh

Sau khi import, kiểm tra trong MongoDB:

```javascript
// Trong MongoDB shell hoặc MongoDB Compass
db.locations.findOne({ name: /Hải Sản/ })
db.vouchers.findOne({ conditions: /Áp dụng/ })
```

Nếu query trả về kết quả với tiếng Việt hiển thị đúng, thì encoding đã OK.

