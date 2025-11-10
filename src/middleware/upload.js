const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const sanitizeFilename = (name) => name.replace(/[^a-zA-Z0-9-_]/g, '_');

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
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${basename}-${unique}${ext.toLowerCase()}`);
  }
});

const mediaFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận tệp hình ảnh hoặc video'));
  }
};

const reviewUpload = multer({
  storage: reviewStorage,
  fileFilter: mediaFileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB mỗi tệp
    files: 5
  }
});

module.exports = {
  reviewUpload
};

