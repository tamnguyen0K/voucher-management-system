// =======================================
//  File: scripts/seedDatabase.js
//  Mục đích: Seed dữ liệu mẫu cho hệ thống (user, location, voucher, review)
// =======================================

require('dotenv').config({ path: './src/config/dotenv' });
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Location = require('../models/location.model');
const Voucher = require('../models/voucher.model');
const Review = require('../models/review.model');

// Hàm: connectDB
// Chức năng: Kết nối đến MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voucher_system';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Hàm: seedDatabase
// Chức năng: Xóa dữ liệu cũ và tạo mới các user, location, voucher, review
const seedDatabase = async () => {
  try {
    await User.deleteMany({});
    await Location.deleteMany({});
    await Voucher.deleteMany({});
    await Review.deleteMany({});
    console.log('Cleared existing data');

    const admin = new User({
      username: 'admin',
      idName: 'admin',
      phoneNumber: '0912345678',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });

    const owner1 = new User({
      username: 'owner1',
      idName: 'owner1',
      phoneNumber: '0912345679',
      email: 'owner1@example.com',
      password: 'owner123',
      role: 'owner'
    });

    const owner2 = new User({
      username: 'owner2',
      idName: 'owner2',
      phoneNumber: '0912345680',
      email: 'owner2@example.com',
      password: 'owner123',
      role: 'owner'
    });

    const user1 = new User({
      username: 'user1',
      idName: 'user1',
      phoneNumber: '0912345681',
      email: 'user1@example.com',
      password: 'user123',
      role: 'user'
    });

    const user2 = new User({
      username: 'user2',
      idName: 'user2',
      phoneNumber: '0912345682',
      email: 'user2@example.com',
      password: 'user123',
      role: 'user'
    });

    await admin.save();
    await owner1.save();
    await owner2.save();
    await user1.save();
    await user2.save();
    console.log('Created users');

    const locations = [
      {
        name: 'Nhà hàng Hải Sản Xanh',
        description: 'Chuyên phục vụ hải sản tươi ngon...',
        address: '123 Đường Bến Nghé, Quận 1, TP.HCM',
        type: 'restaurant',
        imageUrl: 'https://via.placeholder.com/400x300/007bff/ffffff?text=Hải+Sản+Xanh',
        owner: owner1._id
      },
      {
        name: 'Cà phê Sách Thư Viện',
        description: 'Không gian yên tĩnh để đọc sách...',
        address: '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
        type: 'cafe',
        imageUrl: 'https://via.placeholder.com/400x300/28a745/ffffff?text=Cafe+Sách',
        owner: owner1._id
      },
      {
        name: 'Chợ Bến Thành',
        description: 'Khu chợ truyền thống nổi tiếng...',
        address: 'Chợ Bến Thành, Quận 1, TP.HCM',
        type: 'tourist_spot',
        imageUrl: 'https://via.placeholder.com/400x300/ffc107/ffffff?text=Chợ+Bến+Thành',
        owner: owner2._id
      },
      {
        name: 'Nhà hàng Gia Đình Ngon',
        description: 'Món ăn gia đình truyền thống...',
        address: '789 Đường Lê Lợi, Quận 3, TP.HCM',
        type: 'restaurant',
        imageUrl: 'https://via.placeholder.com/400x300/dc3545/ffffff?text=Gia+Đình+Ngon',
        owner: owner2._id
      },
      {
        name: 'Cà phê View Rooftop',
        description: 'Quán cà phê tầng thượng...',
        address: '321 Đường Pasteur, Quận 3, TP.HCM',
        type: 'cafe',
        imageUrl: 'https://via.placeholder.com/400x300/6f42c1/ffffff?text=Rooftop+Cafe',
        owner: owner2._id
      },
      {
        name: 'Bảo tàng Lịch sử Việt Nam',
        description: 'Nơi lưu giữ các hiện vật lịch sử...',
        address: '2 Nguyễn Bỉnh Khiêm, Quận 1, TP.HCM',
        type: 'tourist_spot',
        imageUrl: 'https://via.placeholder.com/400x300/17a2b8/ffffff?text=Bảo+Tàng',
        owner: owner1._id
      }
    ];

    const createdLocations = await Location.insertMany(locations);
    console.log('Created locations');

    const vouchers = [
      {
        code: 'SEAFOOD20',
        discountPct: 20,
        quantityTotal: 50,
        quantityClaimed: 12,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        location: createdLocations[0]._id,
        conditions: 'Áp dụng cho hóa đơn từ 500,000đ trở lên'
      },
      {
        code: 'COFFEE15',
        discountPct: 15,
        quantityTotal: 100,
        quantityClaimed: 25,
        startDate: new Date(),
        endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        location: createdLocations[1]._id,
        conditions: 'Áp dụng cho đồ uống từ 50,000đ'
      },
      {
        code: 'MARKET10',
        discountPct: 10,
        quantityTotal: 200,
        quantityClaimed: 45,
        startDate: new Date(),
        endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        location: createdLocations[2]._id,
        conditions: 'Áp dụng cho mua sắm từ 200,000đ'
      },
      {
        code: 'FAMILY25',
        discountPct: 25,
        quantityTotal: 30,
        quantityClaimed: 8,
        startDate: new Date(),
        endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        location: createdLocations[3]._id,
        conditions: 'Áp dụng cho gia đình từ 4 người'
      },
      {
        code: 'ROOFTOP30',
        discountPct: 30,
        quantityTotal: 40,
        quantityClaimed: 15,
        startDate: new Date(),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        location: createdLocations[4]._id,
        conditions: 'Áp dụng vào cuối tuần'
      },
      {
        code: 'MUSEUM50',
        discountPct: 50,
        quantityTotal: 100,
        quantityClaimed: 30,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        location: createdLocations[5]._id,
        conditions: 'Áp dụng cho sinh viên và học sinh'
      }
    ];

    await Voucher.insertMany(vouchers);
    console.log('Created vouchers');

    const reviews = [
      { user: user1._id, location: createdLocations[0]._id, rating: 5, comment: 'Hải sản rất tươi ngon.' },
      { user: user2._id, location: createdLocations[0]._id, rating: 4, comment: 'Nên đặt bàn trước.' },
      { user: user1._id, location: createdLocations[1]._id, rating: 5, comment: 'Không gian yên tĩnh, cà phê ngon.' },
      { user: user2._id, location: createdLocations[1]._id, rating: 4, comment: 'Wifi ổn định.' },
      { user: user1._id, location: createdLocations[2]._id, rating: 4, comment: 'Chợ truyền thống thú vị.' },
      { user: user2._id, location: createdLocations[2]._id, rating: 3, comment: 'Hơi đông đúc nhưng vui.' },
      { user: user1._id, location: createdLocations[3]._id, rating: 4, comment: 'Món ăn gia đình ngon.' },
      { user: user2._id, location: createdLocations[4]._id, rating: 5, comment: 'View đẹp, cà phê ngon.' },
      { user: user1._id, location: createdLocations[5]._id, rating: 4, comment: 'Bảo tàng thú vị.' }
    ];

    await Review.insertMany(reviews);
    console.log('Created reviews');

    
    for (const location of createdLocations) {
      const locationReviews = reviews.filter(r => r.location.toString() === location._id.toString());
      if (locationReviews.length > 0) {
        const totalRating = locationReviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = totalRating / locationReviews.length;
        location.rating = Math.round(avgRating * 10) / 10;
        await location.save();
      }
    }

    console.log('Updated location ratings');
    console.log('Database seeded successfully!');

    console.log('\n=== SEED SUMMARY ===');
    console.log(`Users: ${await User.countDocuments()}`);
    console.log(`Locations: ${await Location.countDocuments()}`);
    console.log(`Vouchers: ${await Voucher.countDocuments()}`);
    console.log(`Reviews: ${await Review.countDocuments()}`);

    console.log('\n=== TEST ACCOUNTS ===');
    console.log('Admin: admin@example.com / admin123');
    console.log('Owner: owner1@example.com / owner123');
    console.log('User: user1@example.com / user123');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

// Hàm: runSeed
// Chức năng: Thực thi toàn bộ quá trình seed
const runSeed = async () => {
  await connectDB();
  await seedDatabase();
};

runSeed();