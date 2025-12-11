/**
 * File: config/db.js
 * 
 * Mô tả: Module kết nối MongoDB bằng Mongoose
 * - Hàm connectDB: Kết nối đến MongoDB database
 * - Xử lý lỗi kết nối và thoát process nếu thất bại
 * 
 * Công nghệ sử dụng:
 * - Mongoose: MongoDB ODM (Object Document Mapper)
 * - MongoDB: NoSQL database
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voucher_system';
    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
