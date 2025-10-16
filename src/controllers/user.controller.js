// Import các model cần thiết
const User = require('../models/user.model');     // Model người dùng
const Review = require('../models/review.model'); // Model đánh giá
const Voucher = require('../models/voucher.model'); // Model voucher (phiếu giảm giá)

// ==================================
// Hàm hiển thị trang đăng nhập / đăng ký
// ==================================
const renderLoginRegister = (req, res) => {
  // Render trang login_register.ejs (hoặc .hbs tùy template)
  res.render('pages/login_register', {
    title: 'Đăng nhập / Đăng ký',
    error: req.flash('error'),     // Hiển thị thông báo lỗi (nếu có)
    success: req.flash('success')  // Hiển thị thông báo thành công
  });
};

// ==================================
// Hàm đăng ký tài khoản người dùng mới
// ==================================
const register = async (req, res) => {
  try {
    // Lấy dữ liệu từ form gửi lên
    const { username, email, password, confirmPassword } = req.body;

    // Kiểm tra xác nhận mật khẩu
    if (password !== confirmPassword) {
      req.flash('error', 'Mật khẩu xác nhận không khớp');
      return res.redirect('/auth');
    }

    // Kiểm tra xem email hoặc username đã tồn tại trong DB chưa
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      req.flash('error', 'Email hoặc username đã tồn tại');
      return res.redirect('/auth');
    }

    // Nếu chưa tồn tại → tạo tài khoản mới
    const user = new User({
      username,
      email,
      password,   // Mật khẩu sẽ được mã hóa trong model (pre-save hook)
      role: 'user' // Mặc định người dùng mới là user thường
    });

    // Lưu vào cơ sở dữ liệu MongoDB
    await user.save();

    req.flash('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
    res.redirect('/auth');
  } catch (error) {
    console.error('Register error:', error);
    req.flash('error', 'Có lỗi xảy ra khi đăng ký');
    res.redirect('/auth');
  }
};

// ==================================
// Hàm đăng nhập người dùng
// ==================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body; // Lấy email và mật khẩu từ form

    // Tìm người dùng bằng email
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Email hoặc mật khẩu không đúng');
      return res.redirect('/auth');
    }

    // Kiểm tra mật khẩu có khớp không (hàm comparePassword định nghĩa trong model)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Email hoặc mật khẩu không đúng');
      return res.redirect('/auth');
    }

    // Nếu đăng nhập thành công → lưu thông tin vào session
    req.session.userId = user._id;     // ID người dùng
    req.session.userRole = user.role;  // Vai trò (user/admin/owner)
    req.session.username = user.username;

    req.flash('success', `Chào mừng ${user.username}!`);
    
    // Điều hướng dựa vào vai trò người dùng
    if (user.role === 'admin') {
      res.redirect('/admin/dashboard');     // Admin → dashboard quản trị
    } else if (user.role === 'owner') {
      res.redirect('/owner/dashboard');     // Chủ địa điểm → dashboard riêng
    } else {
      res.redirect('/');                    // Người dùng bình thường → trang chủ
    }
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Có lỗi xảy ra khi đăng nhập');
    res.redirect('/auth');
  }
};

// ==================================
// Hàm đăng xuất người dùng
// ==================================
const logout = (req, res) => {
  // Hủy session hiện tại
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/'); // Quay về trang chủ sau khi đăng xuất
  });
};

// ==================================
// Hàm xem thông tin cá nhân người dùng (Profile)
// ==================================
const getProfile = async (req, res) => {
  try {
    const userId = req.session.userId; // Lấy ID người dùng đang đăng nhập
    
    // Lấy tất cả các review mà người dùng này đã tạo
    const reviews = await Review.find({ user: userId })
      .populate('location', 'name')  // Lấy thêm tên địa điểm trong mỗi review
      .sort({ createdAt: -1 });      // Sắp xếp review mới nhất lên đầu

    // Lấy danh sách voucher mà người dùng đã nhận (hiện chưa có model lịch sử)
    const claimedVouchers = []; // Tạm thời để trống, có thể mở rộng sau

    // Render trang profile
    res.render('pages/profile', {
      title: 'Thông tin cá nhân',
      user: req.session,          // Gửi thông tin user từ session
      reviews,                    // Gửi danh sách đánh giá
      claimedVouchers             // Gửi danh sách voucher (hiện rỗng)
    });
  } catch (error) {
    console.error('Get profile error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải thông tin');
    res.redirect('/');
  }
};

// ==================================
// Xuất module để sử dụng bên ngoài
// ==================================
module.exports = {
  renderLoginRegister,
  register,
  login,
  logout,
  getProfile
};
