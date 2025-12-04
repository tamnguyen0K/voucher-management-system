/**
 * File: config/migrate.js
 * 
 * Mô tả: Script migration để cập nhật user cũ
 * - Thêm phoneNumber và idName cho các user chưa có
 * - Tự động generate phoneNumber ngẫu nhiên nếu thiếu
 * - Set idName = username nếu thiếu
 * 
 * Công nghệ sử dụng:
 * - Mongoose: MongoDB ODM
 * - MongoDB: Database operations (find, updateOne)
 * - Dotenv: Quản lý biến môi trường
 */

require('dotenv').config({ path: './src/config/dotenv' });
const mongoose = require('mongoose');
const User = require('../models/user.model');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voucher_system';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for migration');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const migrateDatabase = async () => {
  try {
    console.log('Starting migration...');
    const usersToUpdate = await User.find({
      $or: [
        { phoneNumber: { $exists: false } },
        { phoneNumber: null },
        { phoneNumber: '' },
        { idName: { $exists: false } },
        { idName: null },
        { idName: '' }
      ]
    });

    console.log(`Found ${usersToUpdate.length} users to update`);

    if (usersToUpdate.length === 0) {
      console.log('No users need migration. Database is already up to date!');
      await mongoose.disconnect();
      return;
    }

    let updatedCount = 0;
    for (const user of usersToUpdate) {
      const updates = {};
      if (!user.idName && user.username) {
        updates.idName = user.username;
      }
      if (!user.phoneNumber) {
        const randomPhone = `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
        let phoneExists = await User.findOne({ phoneNumber: randomPhone });
        let finalPhone = randomPhone;
        let counter = 0;
        while (phoneExists && counter < 100) {
          finalPhone = `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
          phoneExists = await User.findOne({ phoneNumber: finalPhone });
          counter++;
        }
        updates.phoneNumber = finalPhone;
      }
      if (Object.keys(updates).length > 0) {
        await User.updateOne({ _id: user._id }, { $set: updates });
        console.log(`Updated user: ${user.username}`);
        updatedCount++;
      }
    }

    console.log(`\nMigration completed! Updated ${updatedCount} users.`);
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Migration error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

(async () => {
  await connectDB();
  await migrateDatabase();
})();
