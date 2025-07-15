import multer from 'multer';
import path from 'path';
import fs from 'fs';

const __dirname = import.meta.dirname;

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const templateStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../Uploads/templates');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const signatureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../Uploads/signatures');
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

export const requestUpload = multer({
  storage: templateStorage,
  fileFilter: (req, file, cb) => {
    const excelTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    const templateTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-word'
    ];
    if (
      (file.fieldname === 'documents' && excelTypes.includes(file.mimetype)) ||
      (file.fieldname === 'templateFile' && templateTypes.includes(file.mimetype))
    ) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${file.fieldname}`));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

export const signatureUpload = multer({
  storage: signatureStorage,
  fileFilter: (req, file, cb) => {
    const imageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (imageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});