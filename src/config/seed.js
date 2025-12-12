/**
 * File: config/seed.js
 * 
 * Mô tả: Script seed dữ liệu mẫu cho hệ thống
 * - Tạo users: admin, owners, users
 * - Tạo locations mẫu
 * - Tạo vouchers mẫu
 * - Tạo reviews mẫu
 */

require('dotenv').config({ path: './src/config/dotenv' });
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const Location = require('../models/location.model');
const Voucher = require('../models/voucher.model');
const Review = require('../models/review.model');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voucher_system';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  console.log('🗑️  Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Location.deleteMany({}),
    Voucher.deleteMany({}),
    Review.deleteMany({})
  ]);
  console.log('✅ Database cleared');
};

const seedUsers = async () => {
  console.log('👥 Creating users...');
  
  const users = [
    {
      username: 'admin',
      idName: 'admin',
      email: 'admin@example.com',
      phoneNumber: '0901234567',
      password: 'admin123',
      role: 'admin'
    },
    {
      username: 'owner1',
      idName: 'owner1',
      email: 'owner1@example.com',
      phoneNumber: '0902345678',
      password: 'owner123',
      role: 'owner'
    },
    {
      username: 'owner2',
      idName: 'owner2',
      email: 'owner2@example.com',
      phoneNumber: '0903456789',
      password: 'owner123',
      role: 'owner'
    },
    {
      username: 'user1',
      idName: 'user1',
      email: 'user1@example.com',
      phoneNumber: '0904567890',
      password: 'user123',
      role: 'user'
    },
    {
      username: 'user2',
      idName: 'user2',
      email: 'user2@example.com',
      phoneNumber: '0905678901',
      password: 'user123',
      role: 'user'
    }
  ];

  const createdUsers = await User.insertMany(users);
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
};

const seedLocations = async (users) => {
  console.log('📍 Creating locations...');
  
  const owner1 = users.find(u => u.username === 'owner1');
  const owner2 = users.find(u => u.username === 'owner2');

  const locations = [
    {
      name: 'Highlands Coffee Nguyễn Huệ',
      description: 'Quán cà phê Highlands Coffee tại trung tâm thành phố, không gian rộng rãi, thoáng mát với view nhìn ra đường Nguyễn Huệ sầm uất. Phù hợp cho làm việc, họp nhóm hay hẹn hò.',
      address: '123 Nguyễn Huệ, Quận 1',
      type: 'cafe',
      imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
      city: 'Hồ Chí Minh',
      priceLevel: 'standard',
      priceRange: { min: 50000, max: 120000 },
      features: ['Phù hợp làm việc', 'View đẹp', 'Không gian yên tĩnh', 'Wifi mạnh'],
      menuHighlights: ['Cà phê rang xay', 'Cold Brew', 'Bánh ngọt', 'Trà trái cây'],
      keywords: ['highlands', 'coffee', 'ca phe', 'nguyen hue', 'quan 1', 'lam viec', 'wifi'],
      owner: owner1._id,
      rating: 4.5
    },
    {
      name: 'Phở Hòa Pasteur',
      description: 'Quán phở nổi tiếng với hơn 30 năm kinh nghiệm, phở bò tái, phở gà đặc biệt. Nước dùng ninh xương heo từ 8 tiếng, thơm ngon đậm đà. Giá cả phải chăng, phục vụ nhanh.',
      address: '456 Pasteur, Quận 3',
      type: 'restaurant',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
      city: 'Hồ Chí Minh',
      priceLevel: 'budget',
      priceRange: { min: 40000, max: 70000 },
      features: ['Giá rẻ', 'Món ăn truyền thống', 'Phục vụ nhanh'],
      menuHighlights: ['Phở bò tái', 'Phở gà', 'Bún bò Huế', 'Nem rán'],
      keywords: ['pho', 'pho bo', 'pasteur', 'quan 3', 'gia re', 'truyen thong'],
      owner: owner1._id,
      rating: 4.8
    },
    {
      name: 'The Coffee House Võ Văn Tần',
      description: 'Không gian cà phê hiện đại với thiết kế trẻ trung, năng động. Menu đa dạng với các loại đồ uống signature độc đáo. Có khu vực sống ảo đẹp cho giới trẻ check-in.',
      address: '789 Võ Văn Tần, Quận 3',
      type: 'cafe',
      imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800',
      city: 'Hồ Chí Minh',
      priceLevel: 'standard',
      priceRange: { min: 35000, max: 95000 },
      features: ['Sống ảo / check-in', 'Đồ uống signature', 'Không gian trẻ trung'],
      menuHighlights: ['Bạc xỉu đá xay', 'Trà sữa trân châu', 'Bánh tiramisu', 'Mojito'],
      keywords: ['the coffee house', 'tch', 'vo van tan', 'song ao', 'check in', 'tre trung'],
      owner: owner2._id,
      rating: 4.3
    },
    {
      name: 'Nhà Hàng Hải Sản Biển Đông',
      description: 'Nhà hàng hải sản cao cấp với hải sản tươi sống mỗi ngày. Không gian rộng rãi phù hợp gia đình, tiệc công ty. Có bể nuôi hải sản tươi sống, khách có thể tự chọn.',
      address: '321 Điện Biên Phủ, Quận Bình Thạnh',
      type: 'restaurant',
      imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
      city: 'Hồ Chí Minh',
      priceLevel: 'premium',
      priceRange: { min: 200000, max: 500000 },
      features: ['Phù hợp gia đình / nhóm', 'Hải sản tươi sống', 'Không gian cao cấp'],
      menuHighlights: ['Tôm hùm nướng', 'Cua hoàng đế hấp', 'Ghẹ rang me', 'Cá mú hấp'],
      keywords: ['hai san', 'seafood', 'cao cap', 'gia dinh', 'binh thanh', 'tuoi song'],
      owner: owner2._id,
      rating: 4.7
    },
    {
      name: 'Trà Sữa Gongcha Lê Văn Sỹ',
      description: 'Thương hiệu trà sữa nổi tiếng với topping trân châu ngon, trà xanh thơm mát. Không gian nhỏ xinh, phù hợp hẹn hò hoặc thư giãn sau giờ làm việc.',
      address: '147 Lê Văn Sỹ, Quận 3',
      type: 'cafe',
      imageUrl: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=800',
      city: 'Hồ Chí Minh',
      priceLevel: 'budget',
      priceRange: { min: 30000, max: 60000 },
      features: ['Giá sinh viên', 'Menu đa dạng', 'Take away'],
      menuHighlights: ['Trà sữa trân châu', 'Trà xanh matcha', 'Trà đào cam sả', 'Pudding'],
      keywords: ['tra sua', 'gongcha', 'le van sy', 'tran chau', 'sinh vien'],
      owner: owner1._id,
      rating: 4.4
    },
    {
      name: 'Pizza 4Ps Lê Thánh Tôn',
      description: 'Nhà hàng pizza phong cách Nhật Bản với nguyên liệu nhập khẩu cao cấp. Pho mát tươi tự làm hàng ngày, đế pizza giòn tan. Không gian hiện đại, sang trọng.',
      address: '258 Lê Thánh Tôn, Quận 1',
      type: 'restaurant',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
      city: 'Hồ Chí Minh',
      priceLevel: 'premium',
      priceRange: { min: 150000, max: 350000 },
      features: ['Không gian sang trọng', 'Món Âu cao cấp', 'Phù hợp hẹn hò'],
      menuHighlights: ['Pizza Burrata', 'Salad Caesar', 'Tiramisu', 'Pasta Carbonara'],
      keywords: ['pizza', '4ps', 'le thanh ton', 'nhat ban', 'cao cap', 'mon au'],
      owner: owner2._id,
      rating: 4.6
    }
  ];

  const createdLocations = await Location.insertMany(locations);
  console.log(`✅ Created ${createdLocations.length} locations`);
  return createdLocations;
};

const seedVouchers = async (locations) => {
  console.log('🎟️  Creating vouchers...');
  
  const now = new Date();
  const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const vouchers = [
    {
      code: 'HIGHLAND20',
      discountPct: 20,
      quantityTotal: 100,
      quantityClaimed: 15,
      startDate: now,
      endDate: futureDate,
      location: locations[0]._id,
      conditions: 'Áp dụng cho hóa đơn từ 100.000đ. Không áp dụng với chương trình khác.'
    },
    {
      code: 'PHO30',
      discountPct: 30,
      quantityTotal: 50,
      quantityClaimed: 25,
      startDate: now,
      endDate: futureDate,
      location: locations[1]._id,
      conditions: 'Giảm 30% tối đa 50.000đ. Áp dụng từ 7h-11h sáng.'
    },
    {
      code: 'TCH15',
      discountPct: 15,
      quantityTotal: 200,
      quantityClaimed: 45,
      startDate: now,
      endDate: futureDate,
      location: locations[2]._id,
      conditions: 'Áp dụng cho tất cả đồ uống. Không giới hạn giá trị đơn hàng.'
    },
    {
      code: 'SEAFOOD25',
      discountPct: 25,
      quantityTotal: 30,
      quantityClaimed: 8,
      startDate: now,
      endDate: futureDate,
      location: locations[3]._id,
      conditions: 'Áp dụng cho hóa đơn từ 500.000đ. Giảm tối đa 200.000đ.'
    },
    {
      code: 'GONGCHA10',
      discountPct: 10,
      quantityTotal: 150,
      quantityClaimed: 67,
      startDate: now,
      endDate: futureDate,
      location: locations[4]._id,
      conditions: 'Áp dụng mọi size. Mua 2 tặng 1 topping.'
    },
    {
      code: 'PIZZA4PS20',
      discountPct: 20,
      quantityTotal: 40,
      quantityClaimed: 12,
      startDate: now,
      endDate: futureDate,
      location: locations[5]._id,
      conditions: 'Giảm 20% cho hóa đơn từ 300.000đ. Áp dụng cả ngày.'
    },
    {
      code: 'NEWYEAR50',
      discountPct: 50,
      quantityTotal: 20,
      quantityClaimed: 2,
      startDate: now,
      endDate: futureDate,
      location: locations[0]._id,
      conditions: 'Voucher đặc biệt chào năm mới. Giảm 50% tối đa 100.000đ.'
    },
    {
      code: 'WEEKEND35',
      discountPct: 35,
      quantityTotal: 60,
      quantityClaimed: 18,
      startDate: now,
      endDate: futureDate,
      location: locations[1]._id,
      conditions: 'Chỉ áp dụng thứ 7, chủ nhật. Giảm tối đa 70.000đ.'
    }
  ];

  const createdVouchers = await Voucher.insertMany(vouchers);
  console.log(`✅ Created ${createdVouchers.length} vouchers`);
  return createdVouchers;
};

const seedReviews = async (users, locations) => {
  console.log('⭐ Creating reviews...');
  
  const user1 = users.find(u => u.username === 'user1');
  const user2 = users.find(u => u.username === 'user2');

  const reviews = [
    {
      user: user1._id,
      location: locations[0]._id,
      rating: 5,
      comment: 'Quán rất đẹp, nhân viên thân thiện. Cà phê thơm ngon, không gian yên tĩnh phù hợp làm việc.',
      media: []
    },
    {
      user: user2._id,
      location: locations[0]._id,
      rating: 4,
      comment: 'View đẹp nhưng hơi đông vào giờ cao điểm. Giá hơi cao một chút.',
      media: []
    },
    {
      user: user1._id,
      location: locations[1]._id,
      rating: 5,
      comment: 'Phở ngon tuyệt vời! Nước dùng đậm đà, thịt bò mềm. Giá cả hợp lý, sẽ quay lại.',
      media: []
    },
    {
      user: user2._id,
      location: locations[1]._id,
      rating: 5,
      comment: 'Quán phở truyền thống ngon nhất tôi từng ăn. Chủ quán rất nhiệt tình.',
      media: []
    },
    {
      user: user1._id,
      location: locations[2]._id,
      rating: 4,
      comment: 'Không gian đẹp, đồ uống ngon. Góc chụp ảnh rất đẹp cho Instagram.',
      media: []
    },
    {
      user: user2._id,
      location: locations[3]._id,
      rating: 5,
      comment: 'Hải sản tươi ngon, phục vụ chuyên nghiệp. Phù hợp tiệc gia đình.',
      media: []
    },
    {
      user: user1._id,
      location: locations[4]._id,
      rating: 4,
      comment: 'Trà sữa ngon, trân châu dai. Giá sinh viên rất ok.',
      media: []
    },
    {
      user: user2._id,
      location: locations[5]._id,
      rating: 5,
      comment: 'Pizza tuyệt vời! Pho mát tươi thơm ngon. Không gian sang trọng, đáng giá tiền.',
      media: []
    },
    {
      user: user1._id,
      location: locations[5]._id,
      rating: 4,
      comment: 'Món ăn ngon nhưng hơi chờ lâu. Nhân viên phục vụ nhiệt tình.',
      media: []
    }
  ];

  const createdReviews = await Review.insertMany(reviews);
  console.log(`✅ Created ${createdReviews.length} reviews`);
  return createdReviews;
};

const seed = async () => {
  try {
    await connectDB();
    await clearDatabase();
    
    const users = await seedUsers();
    const locations = await seedLocations(users);
    const vouchers = await seedVouchers(locations);
    const reviews = await seedReviews(users, locations);

    console.log('\n🎉 Seeding completed successfully!');
    console.log('='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Locations: ${locations.length}`);
    console.log(`   Vouchers: ${vouchers.length}`);
    console.log(`   Reviews: ${reviews.length}`);
    console.log('='.repeat(50));
    console.log('\n📝 Demo Accounts:');
    console.log('   Admin:  admin@example.com / admin123');
    console.log('   Owner1: owner1@example.com / owner123');
    console.log('   Owner2: owner2@example.com / owner123');
    console.log('   User1:  user1@example.com / user123');
    console.log('   User2:  user2@example.com / user123');
    
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
