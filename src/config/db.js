// =========================
//  File: config/db.js
//  Mục đích: Kết nối MongoDB bằng Mongoose
// =========================

const mongoose = require('mongoose');

// Hàm: connectDB
// Chức năng: Kết nối đến cơ sở dữ liệu MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voucher_system';
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;