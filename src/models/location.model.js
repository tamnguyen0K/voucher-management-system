// Import thư viện mongoose để định nghĩa schema và model
const mongoose = require('mongoose');

// Định nghĩa cấu trúc dữ liệu (schema) cho một địa điểm (location)
const locationSchema = new mongoose.Schema({
  name: {
    type: String,                                                  // Kiểu dữ liệu là chuỗi
    required: [true, 'Location name is required'],                 // Bắt buộc phải có
    trim: true,                                                    // Tự động loại bỏ khoảng trắng ở đầu/cuối
    maxlength: [100, 'Location name cannot exceed 100 characters'] // Giới hạn độ dài
  },

  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },

  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },

  // Phân loại địa điểm: nhà hàng, quán cà phê, hay điểm du lịch
  type: {
    type: String,
    required: [true, 'Location type is required'],
    enum: ['restaurant', 'cafe', 'tourist_spot'], // Chỉ được chọn trong danh sách này
    default: 'restaurant'
  },

  // Điểm đánh giá trung bình (ví dụ: 4.5 sao)
  rating: {
    type: Number,
    default: 0,                                // Nếu chưa có đánh giá thì mặc định = 0
    min: [0, 'Rating cannot be less than 0'],  // Giới hạn nhỏ nhất
    max: [5, 'Rating cannot exceed 5']         // Giới hạn lớn nhất
  },

  // Ảnh đại diện của địa điểm
  imageUrl: {
    type: String,
    default: 'https://via.placeholder.com/400x300?text=No+Image',
    trim: true
  },

  // Tham chiếu đến người sở hữu địa điểm (liên kết với model User)
  owner: {
    type: mongoose.Schema.Types.ObjectId, // Dùng ObjectId để tham chiếu
    ref: 'User',                          // Liên kết đến collection "users"
    required: [true, 'Owner is required']
  },

  // Ngày tạo địa điểm (tự động gán khi thêm mới)
  createdAt: {
    type: Date,
    default: Date.now
  }
});


// Tạo virtual field (trường ảo, không lưu vào DB)
// Giúp hiển thị rating đã làm tròn 1 chữ số thập phân
locationSchema.virtual('averageRating').get(function() {
  return this.rating.toFixed(1); // Ví dụ 4 → "4.0"
});


// Cấu hình để khi chuyển sang JSON (ví dụ khi gửi API),
// thì các virtual field cũng được bao gồm
locationSchema.set('toJSON', { virtuals: true });


// Tạo model Location từ schema và export để dùng ở nơi khác
// Trong MongoDB, model này sẽ tương ứng với collection "locations"
module.exports = mongoose.model('Location', locationSchema);