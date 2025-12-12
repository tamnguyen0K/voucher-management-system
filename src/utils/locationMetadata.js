/**
 * File: locationMetadata.js
 * 
 * Mô tả: Chứa các metadata tiêu chuẩn cho Location
 * - Các loại địa điểm (category)
 * - Các loại giá (priceRange)
 * - Các tiện ích/đặc điểm (features)
 * - Các giờ mở cửa tiêu chuẩn
 * 
 * Sử dụng: Trong templates EJS để hiển thị dropdown, checkbox, tag các thông tin location
 */

module.exports = {
  categories: [
    { value: 'restaurant', label: 'Nhà hàng' },
    { value: 'cafe', label: 'Quán cà phê' },
    { value: 'bar', label: 'Bar/Pub' },
    { value: 'hotel', label: 'Khách sạn' },
    { value: 'spa', label: 'Spa/Massage' },
    { value: 'entertainment', label: 'Giải trí' },
    { value: 'shop', label: 'Cửa hàng' },
    { value: 'other', label: 'Khác' }
  ],

  priceRanges: [
    { value: 'budget', label: 'Dưới 200K' },
    { value: 'moderate', label: '200K - 500K' },
    { value: 'expensive', label: '500K - 1M' },
    { value: 'luxury', label: 'Trên 1M' }
  ],

  features: [
    { value: 'wifi', label: 'WiFi miễn phí' },
    { value: 'parking', label: 'Bãi đỗ xe' },
    { value: 'air_conditioning', label: 'Điều hòa' },
    { value: 'outdoor_seating', label: 'Chỗ ngồi ngoài trời' },
    { value: 'wheelchair_accessible', label: 'Tiếp cận xe lăn' },
    { value: 'pet_friendly', label: 'Thân thiện với thú cưng' },
    { value: 'live_music', label: 'Nhạc sống' },
    { value: 'delivery', label: 'Giao hàng' },
    { value: 'takeaway', label: 'Mang đi' }
  ],

  businessHours: [
    { value: 'day', label: 'Buổi sáng (6h - 11h)' },
    { value: 'lunch', label: 'Buổi trưa (11h - 14h)' },
    { value: 'afternoon', label: 'Buổi chiều (14h - 17h)' },
    { value: 'evening', label: 'Buổi tối (17h - 22h)' },
    { value: 'night', label: 'Ban đêm (22h - 6h sáng)' }
  ],

  days: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
};
