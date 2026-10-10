const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure base upload directories exist
const uploadDirs = {
  profiles: path.join(__dirname, '../uploads/profiles'),
  properties: path.join(__dirname, '../uploads/properties'),
  documents: path.join(__dirname, '../uploads/documents'),
};

Object.values(uploadDirs).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage generators
const createStorage = (folderKey) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDirs[folderKey]);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${folderKey}-${uniqueSuffix}${ext}`);
    },
  });

// Image file filter (JPEG, PNG, WEBP)
const imageFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Only JPEG, PNG, and WEBP files are allowed.'), false);
  }
};

// Document file filter (PDF, JPEG, PNG, WEBP)
const documentFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
  ];
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid document format. Only PDF, JPEG, PNG, and WEBP files are allowed.'),
      false
    );
  }
};

// Multer upload instances
const uploadProfileAvatar = multer({
  storage: createStorage('profiles'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: imageFilter,
});

const uploadPropertyImages = multer({
  storage: createStorage('properties'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
  fileFilter: imageFilter,
});

const uploadDocument = multer({
  storage: createStorage('documents'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: documentFilter,
});

module.exports = {
  uploadProfileAvatar,
  uploadPropertyImages,
  uploadDocument,
};
