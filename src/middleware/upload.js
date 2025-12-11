/**
 * File: middleware/upload.js
 * 
 * Mô tả: Middleware xử lý upload file cho reviews
 * - reviewUpload: Multer middleware cho phép upload tối đa 5 file (ảnh/video)
 * - Tự động tạo thư mục theo userId trong uploads/reviews/
 * - Sanitize filename và generate unique name để tránh conflict
 * - Giới hạn: 15MB/file, chỉ chấp nhận image/video
 * 
 * Công nghệ sử dụng:
 * - Multer: File upload middleware cho Express
 * - Node.js fs: File system operations
 * - Path: Path manipulation
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const sanitizeFilename = (name) => {
  // Giữ nguyên ký tự tiếng Việt và các ký tự Unicode hợp lệ
  // Chỉ loại bỏ các ký tự đặc biệt nguy hiểm cho filesystem
  return name
    .replace(/[<>:"|?*\x00-\x1F]/g, '_') // Loại bỏ ký tự đặc biệt nguy hiểm
    .replace(/\.\./g, '_') // Loại bỏ path traversal
    .replace(/^\.+|\.+$/g, '_') // Loại bỏ dấu chấm ở đầu/cuối
    .replace(/\s+/g, '_') // Thay khoảng trắng bằng dấu gạch dưới
    .replace(/_+/g, '_') // Gộp nhiều dấu gạch dưới thành một
    .replace(/^_|_$/g, ''); // Loại bỏ dấu gạch dưới ở đầu/cuối
};

const reviewStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.session?.userId ? String(req.session.userId) : 'anonymous';
    const dest = path.join(__dirname, '..', 'uploads', 'reviews', userId);
    ensureDirectory(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const basename = sanitizeFilename(path.basename(file.originalname, ext)) || 'media';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${basename}-${unique}${ext.toLowerCase()}`);
  }
});

const mediaFileFilter = (req, file, cb) => {
  const isValid = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
  cb(isValid ? null : new Error('Chỉ chấp nhận tệp hình ảnh hoặc video'), isValid);
};

const reviewUpload = multer({
  storage: reviewStorage,
  fileFilter: mediaFileFilter,
  limits: { fileSize: 15 * 1024 * 1024, files: 5 }
});

module.exports = { reviewUpload };

