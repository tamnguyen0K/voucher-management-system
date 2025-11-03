// Import các model cần thiết
const User = require('../models/user.model');     // Model người dùng
const Review = require('../models/review.model'); // Model đánh giá
const Voucher = require('../models/voucher.model'); // Model voucher (phiếu giảm giá)

// ==================================
// Hàm hiển thị trang đăng nhập / đăng ký
// ==================================
const renderLoginRegister = (req, res) => {
  // Lấy tab từ query string (login hoặc register), mặc định là login
  const activeTab = req.query.tab || 'login';
  
  // Render trang login_register.ejs (hoặc .hbs tùy template)
  res.render('pages/login_register', {
    title: 'Đăng nhập / Đăng ký',
    error: req.flash('error'),     // Hiển thị thông báo lỗi (nếu có)
    success: req.flash('success'), // Hiển thị thông báo thành công
    activeTab                       // Tab đang được chọn (login hoặc register)
  });
};

// ==================================
// Hàm đăng ký tài khoản người dùng mới
// ==================================
const register = async (req, res) => {
  try {
    // Lấy dữ liệu từ form gửi lên
    const { username, email, password, confirmPassword, role, phonenumber } = req.body;

    // Kiểm tra xác nhận mật khẩu
    if (password !== confirmPassword) {
      req.flash('error', 'Mật khẩu xác nhận không khớp');
      return res.redirect('/auth?tab=register');
    }

    // Kiểm tra và validate role (chỉ cho phép 'user' hoặc 'owner', không cho 'admin')
    const allowedRoles = ['user', 'owner'];
    const selectedRole = role && allowedRoles.includes(role) ? role : 'user';

    // Validate phone number
    if (!phonenumber || !/^[0-9]{9,11}$/.test(phonenumber)) {
      req.flash('error', 'Số điện thoại không hợp lệ (phải có 9-11 chữ số)');
      return res.redirect('/auth?tab=register');
    }

    // Kiểm tra xem email, username hoặc phoneNumber đã tồn tại trong DB chưa
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { username },
        { phoneNumber: phonenumber.trim() }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase().trim()) {
        req.flash('error', 'Email đã tồn tại');
      } else if (existingUser.username === username) {
        req.flash('error', 'Tên đăng nhập đã tồn tại');
      } else if (existingUser.phoneNumber === phonenumber.trim()) {
        req.flash('error', 'Số điện thoại đã được sử dụng');
      } else {
        req.flash('error', 'Thông tin đã tồn tại trong hệ thống');
      }
      return res.redirect('/auth?tab=register');
    }

    // Nếu chưa tồn tại → tạo tài khoản mới
    const user = new User({
      username,
      idName: username, // Đồng bộ idName với username
      phoneNumber: phonenumber.trim(),
      email: email.toLowerCase().trim(),
      password,   // Mật khẩu sẽ được mã hóa trong model (pre-save hook)
      role: selectedRole // Sử dụng role được chọn (user hoặc owner)
    });

    // Lưu vào cơ sở dữ liệu MongoDB
    await user.save();

    req.flash('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
    res.redirect('/auth?tab=login');
  } catch (error) {
    console.error('Register error:', error);
    req.flash('error', 'Có lỗi xảy ra khi đăng ký');
    res.redirect('/auth?tab=register');
  }
};

// ==================================
// Hàm đăng nhập người dùng
// ==================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body; // Lấy email và mật khẩu từ form

    // Kiểm tra email và password có tồn tại không
    if (!email || !password) {
      req.flash('error', 'Vui lòng nhập đầy đủ email và mật khẩu');
      return res.redirect('/auth?tab=login');
    }

    console.log('Login attempt for email:', email);

    // Normalize email (lowercase và trim) để tìm user
    // Email trong schema đã được set lowercase: true nên chỉ cần trim
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      console.log('User not found for email:', normalizedEmail);
      req.flash('error', 'Email hoặc mật khẩu không đúng');
      return res.redirect('/auth?tab=login');
    }

    console.log('User found:', user.username, 'Role:', user.role);

    // Kiểm tra mật khẩu có khớp không (hàm comparePassword định nghĩa trong model)
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Password does not match for user:', user.username);
      req.flash('error', 'Email hoặc mật khẩu không đúng');
      return res.redirect('/auth?tab=login');
    }

    // Nếu đăng nhập thành công → lưu thông tin vào session
    req.session.userId = user._id;     // ID người dùng
    req.session.userRole = user.role;  // Vai trò (user/admin/owner)
    req.session.username = user.username;

    req.flash('success', `Chào mừng ${user.username}!`);
    
    // Điều hướng dựa vào vai trò người dùng
    let redirectUrl = '/';
    if (user.role === 'admin') {
      redirectUrl = '/admin/dashboard';     // Admin → dashboard quản trị
    } else if (user.role === 'owner') {
      redirectUrl = '/owner/dashboard';     // Chủ địa điểm → dashboard riêng
    }
    
    console.log('Login successful, redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Có lỗi xảy ra khi đăng nhập');
    res.redirect('/auth?tab=login');
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
