const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { v4: uuidv4 } = require('uuid');
const { AppError }   = require('../utils/AppError');

const UPLOAD_DIR = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = [
  'audio/wav', 'audio/wave', 'audio/x-wav',
  'audio/mpeg', 'audio/mp3',
  'audio/mp4', 'audio/aac', 'audio/x-aac',
  'audio/ogg', 'audio/flac',
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(UPLOAD_DIR, req.user?.id || 'anonymous');
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${file.mimetype} is not supported. Upload WAV, MP3, AAC, OGG, or FLAC.`, 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 50) * 1024 * 1024,
    files: 1,
  },
});

module.exports = { upload };
