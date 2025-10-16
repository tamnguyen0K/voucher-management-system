// Import các model cần thiết
const Voucher = require('../models/voucher.model');   // Model quản lý voucher
const Location = require('../models/location.model'); // Model quản lý địa điểm

// ==================================
// Lấy danh sách tất cả voucher đang hoạt động
// ==================================
const getAllVouchers = async (req, res) => {
  try {
    const now = new Date(); // Lấy thời điểm hiện tại

    // Tìm tất cả voucher đang trong thời gian hợp lệ và còn số lượng
    const vouchers = await Voucher.find({
      startDate: { $lte: now }, // Voucher đã bắt đầu
      endDate: { $gte: now },   // Voucher chưa hết hạn
      $expr: { $lt: ['$quantityClaimed', '$quantityTotal'] } // Còn voucher chưa được claim hết
    })
      .populate('location', 'name imageUrl type') // Lấy thêm thông tin địa điểm (tên, ảnh, loại)
      .sort({ createdAt: -1 }); // Sắp xếp voucher mới nhất lên đầu

    // Render ra trang danh sách voucher cho người dùng
    res.render('pages/voucher_list', {
      title: 'Danh sách Voucher',
      vouchers
    });
  } catch (error) {
    console.error('Get vouchers error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải danh sách voucher');
    res.redirect('/');
  }
};

// ==================================
// Người dùng claim (nhận) voucher
// ==================================
const claimVoucher = async (req, res) => {
  try {
    const { voucherId } = req.params;
    const userId = req.session.userId;

    // Kiểm tra người dùng đã đăng nhập chưa
    if (!userId) {
      req.flash('error', 'Vui lòng đăng nhập để claim voucher');
      return res.redirect('/auth');
    }

    // Tìm voucher theo ID
    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      req.flash('error', 'Không tìm thấy voucher');
      return res.redirect('/vouchers');
    }

    const now = new Date();
    // Kiểm tra thời gian hợp lệ của voucher
    if (now < voucher.startDate || now > voucher.endDate) {
      req.flash('error', 'Voucher đã hết hạn');
      return res.redirect('/vouchers');
    }

    // Kiểm tra còn số lượng không
    if (voucher.quantityClaimed >= voucher.quantityTotal) {
      req.flash('error', 'Voucher đã hết số lượng');
      return res.redirect('/vouchers');
    }

    // Người dùng claim thành công → tăng số lượng đã claim
    voucher.quantityClaimed += 1;
    await voucher.save();

    // Thông báo thành công
    req.flash(
      'success',
      `Claim voucher ${voucher.code} thành công! Giảm ${voucher.discountPct}%`
    );
    res.redirect('/vouchers');
  } catch (error) {
    console.error('Claim voucher error:', error);
    req.flash('error', 'Có lỗi xảy ra khi claim voucher');
    res.redirect('/vouchers');
  }
};

// ==================================
// Chủ địa điểm tạo voucher mới
// ==================================
const createVoucher = async (req, res) => {
  try {
    // Lấy dữ liệu từ form gửi lên
    const {
      code,
      discountPct,
      quantityTotal,
      startDate,
      endDate,
      locationId,
      conditions
    } = req.body;

    const ownerId = req.session.userId; // ID của chủ sở hữu đang đăng nhập

    // Kiểm tra địa điểm có thuộc quyền sở hữu của chủ này không
    const location = await Location.findOne({
      _id: locationId,
      owner: ownerId
    });

    if (!location) {
      req.flash('error', 'Không tìm thấy địa điểm hoặc bạn không có quyền tạo voucher');
      return res.redirect('/owner/vouchers');
    }

    // Kiểm tra xem mã voucher đã tồn tại chưa
    const existingVoucher = await Voucher.findOne({ code });
    if (existingVoucher) {
      req.flash('error', 'Mã voucher đã tồn tại');
      return res.redirect('/owner/vouchers');
    }

    // Tạo voucher mới
    const voucher = new Voucher({
      code: code.toUpperCase(),      // Viết hoa mã voucher
      discountPct,                   // % giảm giá
      quantityTotal,                 // Tổng số lượng voucher phát hành
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      location: locationId,          // Gắn voucher với địa điểm
      conditions                     // Điều kiện sử dụng voucher (mô tả)
    });

    await voucher.save();
    req.flash('success', 'Tạo voucher thành công!');
    res.redirect('/owner/vouchers');
  } catch (error) {
    console.error('Create voucher error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tạo voucher');
    res.redirect('/owner/vouchers');
  }
};

// ==================================
// Chủ địa điểm cập nhật voucher
// ==================================
const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params; // Lấy ID voucher cần sửa
    const {
      discountPct,
      quantityTotal,
      startDate,
      endDate,
      conditions
    } = req.body;

    const ownerId = req.session.userId;

    // Tìm voucher và kiểm tra quyền sở hữu thông qua địa điểm
    const voucher = await Voucher.findById(id).populate('location');
    if (!voucher || voucher.location.owner.toString() !== ownerId) {
      req.flash('error', 'Không tìm thấy voucher hoặc bạn không có quyền chỉnh sửa');
      return res.redirect('/owner/vouchers');
    }

    // Cập nhật thông tin voucher
    voucher.discountPct = discountPct;
    voucher.quantityTotal = quantityTotal;
    voucher.startDate = new Date(startDate);
    voucher.endDate = new Date(endDate);
    voucher.conditions = conditions;

    await voucher.save();
    req.flash('success', 'Cập nhật voucher thành công!');
    res.redirect('/owner/vouchers');
  } catch (error) {
    console.error('Update voucher error:', error);
    req.flash('error', 'Có lỗi xảy ra khi cập nhật voucher');
    res.redirect('/owner/vouchers');
  }
};

// ==================================
// Chủ địa điểm xóa voucher
// ==================================
const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.session.userId;

    // Tìm voucher và kiểm tra quyền sở hữu
    const voucher = await Voucher.findById(id).populate('location');
    if (!voucher || voucher.location.owner.toString() !== ownerId) {
      req.flash('error', 'Không tìm thấy voucher hoặc bạn không có quyền xóa');
      return res.redirect('/owner/vouchers');
    }

    // Xóa voucher
    await Voucher.findByIdAndDelete(id);
    req.flash('success', 'Xóa voucher thành công!');
    res.redirect('/owner/vouchers');
  } catch (error) {
    console.error('Delete voucher error:', error);
    req.flash('error', 'Có lỗi xảy ra khi xóa voucher');
    res.redirect('/owner/vouchers');
  }
};

// ==================================
// Lấy danh sách voucher của chủ sở hữu (Owner Dashboard)
// ==================================
const getOwnerVouchers = async (req, res) => {
  try {
    const ownerId = req.session.userId;

    // Lấy tất cả địa điểm thuộc chủ này
    const locations = await Location.find({ owner: ownerId });
    const locationIds = locations.map(loc => loc._id); // Lấy danh sách ID địa điểm

    // Tìm tất cả voucher thuộc các địa điểm này
    const vouchers = await Voucher.find({
      location: { $in: locationIds }
    })
      .populate('location', 'name') // Lấy tên địa điểm
      .sort({ createdAt: -1 });

    // Render trang quản lý voucher cho chủ địa điểm
    res.render('admin/manage_voucher', {
      title: 'Quản lý Voucher',
      vouchers,
      locations
    });
  } catch (error) {
    console.error('Get owner vouchers error:', error);
    req.flash('error', 'Có lỗi xảy ra khi tải danh sách voucher');
    res.redirect('/owner/dashboard');
  }
};

// ==================================
// Xuất module để sử dụng ở nơi khác
// ==================================
module.exports = {
  getAllVouchers,
  claimVoucher,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  getOwnerVouchers
};