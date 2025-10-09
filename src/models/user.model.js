// Import thư viện mongoose để tạo schema và model
const mongoose = require('mongoose');
// Import bcrypt để mã hóa (hash) mật khẩu
const bcrypt = require('bcrypt');

// Định nghĩa schema cho người dùng
const userSchema = new mongoose.Schema({
  // Tên đăng nhập
  username: {
    type: String,
    required: [true, 'Username is required'],          // Bắt buộc phải có
    unique: true,                                     // Không được trùng lặp
    trim: true,                                       // Loại bỏ khoảng trắng thừa
    minlength: [3, 'Username must be at least 3 characters'], // Tối thiểu 3 ký tự
    maxlength: [30, 'Username cannot exceed 30 characters']   // Tối đa 30 ký tự
  },

  // Địa chỉ email
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,                                     // Không được trùng email
    trim: true,
    lowercase: true,                                  // Chuyển về chữ thường để đồng nhất
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'] // Regex kiểm tra định dạng email
  },

  // Mật khẩu (sẽ được mã hóa trước khi lưu)
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'] // Mật khẩu tối thiểu 6 ký tự
  },

  // Vai trò người dùng trong hệ thống
  role: {
    type: String,
    enum: ['user', 'owner', 'admin'], // Chỉ chấp nhận 3 loại quyền
    default: 'user'                   // Mặc định là user thường
  },

  // Ngày tạo tài khoản
  createdAt: {
    type: Date,
    default: Date.now
  }
});


// Middleware "pre-save":
// Mã hóa mật khẩu trước khi lưu vào database
userSchema.pre('save', async function(next) {
  // Nếu mật khẩu không thay đổi (khi update thông tin khác) thì bỏ qua
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);        // Tạo salt (ngẫu nhiên để tăng độ bảo mật)
    this.password = await bcrypt.hash(this.password, salt); // Hash mật khẩu
    next();                                       // Tiếp tục quá trình lưu
  } catch (error) {
    next(error);                                  // Nếu lỗi thì dừng lại
  }
});


// Phương thức để so sánh mật khẩu khi người dùng đăng nhập
// Trả về true/false
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};


// Tạo model User và export để dùng trong các file khác
// MongoDB sẽ lưu trong collection "users"
module.exports = mongoose.model('User', userSchema);