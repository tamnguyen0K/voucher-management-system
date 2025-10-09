// =========================
//  File: config/db.js
//  Mục đích: Kết nối MongoDB bằng Mongoose
// =========================

// Import thư viện mongoose để kết nối và làm việc với MongoDB
const mongoose = require('mongoose');

// Định nghĩa hàm async để kết nối cơ sở dữ liệu
const connectDB = async () => {
  try {
    // Lấy đường dẫn kết nối MongoDB từ biến môi trường (MONGODB_URI)
    //    Nếu không có, dùng mặc định là localhost (chạy trên máy cá nhân)
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voucher_system';
    
    // Thực hiện kết nối tới MongoDB
    //    - useNewUrlParser: dùng parser mới cho URI (tránh cảnh báo)
    //    - useUnifiedTopology: dùng engine kết nối mới của MongoDB driver
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Nếu kết nối thành công, in ra tên máy chủ (host)
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Nếu có lỗi khi kết nối, in lỗi ra console
    console.error('❌ Database connection error:', error);

    // Dừng chương trình với mã lỗi (1 = lỗi, 0 = thành công)
    process.exit(1);
  }
};

//  Xuất hàm connectDB để có thể import và sử dụng ở file khác
// Ví dụ: trong server.js có thể gọi: 
//   const connectDB = require('./config/db');
//   connectDB();
module.exports = connectDB;