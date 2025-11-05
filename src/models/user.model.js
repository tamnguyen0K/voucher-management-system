// ==================================
// File: models/user.model.js
// Mục đích: Định nghĩa schema và model cho người dùng (User)
// ==================================

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Định nghĩa schema người dùng
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Vui lòng nhập tên đăng nhập'],
    unique: true,
    trim: true,
    minlength: [3, 'Tên đăng nhập phải có ít nhất 3 ký tự'],
    maxlength: [30, 'Tên đăng nhập không được vượt quá 30 ký tự']
  },

  idName: {
    type: String,
    trim: true
  },

  phoneNumber: {
    type: String,
    required: [true, 'Vui lòng nhập số điện thoại'],
    trim: true,
    match: [/^[0-9]{9,11}$/, 'Số điện thoại phải gồm 9 đến 11 chữ số']
  },

  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },

  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự']
  },

  role: {
    type: String,
    enum: ['user', 'owner', 'admin'],
    default: 'user'
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  claimedVouchers: [{
    voucherCode: {
      type: String,
      required: [true, 'Thiếu mã voucher']
    },
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
      required: [true, 'Thiếu thông tin voucher']
    },
    claimedAt: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      required: [true, 'Thiếu ngày hết hạn']
    },
    locationName: String,
    discountPct: Number
  }]
});

// Mã hóa mật khẩu trước khi lưu và đồng bộ idName
userSchema.pre('save', async function (next) {
  if (!this.idName && this.username) {
    this.idName = this.username;
  }

  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// So sánh mật khẩu khi đăng nhập
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Xuất model User (collection "users")
module.exports = mongoose.model('User', userSchema);
