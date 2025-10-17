const multer = require('multer');
const fs = require('fs');
const path = require('path');

exports.storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'upload';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// ✅ Filter for allowed image types
exports.fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Only .jpg and .png files are allowed!'), false);
  }
};
// ✅ Create upload instance
