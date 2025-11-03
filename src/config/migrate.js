// Script migration để cập nhật database cũ sang cấu trúc mới
// Thêm phoneNumber và idName cho các user đã tồn tại

require('dotenv').config({ path: './src/config/dotenv' });
const mongoose = require('mongoose');
const User = require('../models/user.model');

// Hàm kết nối MongoDB
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

// Hàm migration: cập nhật user cũ
const migrateDatabase = async () => {
  try {
    console.log('Starting migration...');
    
    // Tìm tất cả user không có phoneNumber hoặc idName
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

    // Cập nhật từng user
    let updatedCount = 0;
    for (const user of usersToUpdate) {
      const updates = {};
      
      // Thêm idName nếu chưa có (bằng username)
      if (!user.idName && user.username) {
        updates.idName = user.username;
      }
      
      // Thêm phoneNumber mặc định nếu chưa có
      // Sử dụng pattern: 09 + index (đảm bảo unique)
      if (!user.phoneNumber) {
        // Tạo số điện thoại dựa trên index hoặc random
        const randomPhone = `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
        
        // Kiểm tra số điện thoại đã tồn tại chưa
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
      
      // Cập nhật user nếu có thay đổi
      if (Object.keys(updates).length > 0) {
        await User.updateOne(
          { _id: user._id },
          { $set: updates }
        );
        console.log(`Updated user: ${user.username} - phoneNumber: ${updates.phoneNumber || 'kept'}, idName: ${updates.idName || 'kept'}`);
        updatedCount++;
      }
    }

    console.log(`\nMigration completed! Updated ${updatedCount} users.`);
    console.log('All users now have phoneNumber and idName fields.');
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Migration error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Chạy migration
(async () => {
  await connectDB();
  await migrateDatabase();
})();

