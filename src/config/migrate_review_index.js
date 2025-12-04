/**
 * File: config/migrate_review_index.js
 * 
 * Mô tả: Script migration để xóa unique index từ collection reviews
 * - Cho phép mỗi user có thể review tối đa 3 lần cho mỗi location
 * - Xóa unique index trên (user, location) nếu tồn tại
 * - Tạo composite index mới (không unique) để tăng tốc query
 * 
 * Công nghệ sử dụng:
 * - Mongoose: MongoDB ODM
 * - MongoDB: Database operations (dropIndex, createIndex)
 * - Dotenv: Quản lý biến môi trường
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'dotenv') });

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/voucher_system';
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected for migration');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const migrateReviewIndex = async () => {
  try {
    console.log('Starting review index migration...');
    const db = mongoose.connection.db;
    const reviewsCollection = db.collection('reviews');
    const indexes = await reviewsCollection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));
    
    const uniqueIndexName = 'user_1_location_1';
    const hasUniqueIndex = indexes.some(idx => idx.name === uniqueIndexName && idx.unique === true);
    
    if (hasUniqueIndex) {
      console.log(`Found unique index: ${uniqueIndexName}, dropping...`);
      await reviewsCollection.dropIndex(uniqueIndexName);
      console.log('✅ Unique index dropped successfully');
    } else {
      console.log('No unique index found, skipping drop');
    }
    
    try {
      await reviewsCollection.createIndex({ user: 1, location: 1 }, { 
        name: 'user_1_location_1',
        unique: false 
      });
      console.log('✅ Composite index created successfully');
    } catch (error) {
      if (error.code === 85) {
        console.log('Composite index already exists, skipping');
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('Users can now create up to 3 reviews per location.');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
};

(async () => {
  try {
    await connectDB();
    await migrateReviewIndex();
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
})();
