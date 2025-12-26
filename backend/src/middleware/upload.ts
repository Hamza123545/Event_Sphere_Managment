/**
 * File Upload Middleware
 * Handles multipart/form-data file uploads with multer
 * Implements FR-019 (file upload validation)
 */

import multer from 'multer';
import path from 'path';
import { Request, RequestHandler } from 'express';
import { CustomError } from './errorHandler';
import { logger } from '../utils/logger';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    // Store files in subdirectories based on type
    let subDir = 'general';
    if (file.fieldname === 'logo') {
      subDir = 'logos';
    } else if (file.fieldname === 'documents' || file.fieldname.startsWith('documents')) {
      subDir = 'documents';
    } else if (file.fieldname === 'floorPlanImage' || file.fieldname === 'image') {
      subDir = 'floor-plans';
    } else if (file.fieldname === 'expoImage') {
      subDir = 'expos';
    }
    
    const dir = path.join(uploadsDir, subDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

// File filter function
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
  ];

  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];

  const ext = path.extname(file.originalname).toLowerCase();
  const isValidMimeType = allowedMimeTypes.includes(file.mimetype);
  const isValidExtension = allowedExtensions.includes(ext);

  if (isValidMimeType && isValidExtension) {
    cb(null, true);
  } else {
    cb(
      new CustomError(
        `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`,
        400,
        'INVALID_FILE_TYPE'
      )
    );
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10, // Max 10 files
  },
});

// Middleware for logo upload (single file, max 5MB for logo)
export const uploadLogo: RequestHandler = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    // Logo must be an image
    if (file.mimetype.startsWith('image/')) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        cb(null, true);
      } else {
        cb(new CustomError('Logo must be JPG or PNG', 400, 'INVALID_FILE_TYPE'));
      }
    } else {
      cb(new CustomError('Logo must be an image', 400, 'INVALID_FILE_TYPE'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for logo
  },
}).single('logo');

// Middleware for document uploads (multiple files, max 10MB each)
export const uploadDocuments: RequestHandler = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 10, // Max 10 documents
  },
}).array('documents', 10);

// Combined middleware for exhibitor registration (logo + documents)
export const uploadExhibitorFiles: RequestHandler = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'documents', maxCount: 10 },
]);

// Middleware for floor plan image upload (single image file)
export const uploadFloorPlanImage: RequestHandler = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    // Floor plan image must be an image
    if (file.mimetype.startsWith('image/')) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        cb(null, true);
      } else {
        cb(new CustomError('Floor plan image must be JPG, PNG, GIF, or WEBP', 400, 'INVALID_FILE_TYPE'));
      }
    } else {
      cb(new CustomError('Floor plan image must be an image file', 400, 'INVALID_FILE_TYPE'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for floor plan images
  },
}).single('image');

// Middleware for expo image upload (single image file)
export const uploadExpoImage: RequestHandler = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    // Expo image must be an image
    if (file.mimetype.startsWith('image/')) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        cb(null, true);
      } else {
        cb(new CustomError('Expo image must be JPG, PNG, GIF, or WEBP', 400, 'INVALID_FILE_TYPE'));
      }
    } else {
      cb(new CustomError('Expo image must be an image file', 400, 'INVALID_FILE_TYPE'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max for expo images
  },
}).single('expoImage');

// Error handling wrapper
export const handleUploadError = (
  err: Error,
  _req: Request,
  res: any,
  next: any
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB',
        errorCode: 'FILE_TOO_LARGE',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files',
        errorCode: 'TOO_MANY_FILES',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: `Unexpected file field: ${err.field}`,
        errorCode: 'UNEXPECTED_FILE_FIELD',
      });
    }
    logger.error('Multer error:', err);
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      errorCode: 'UPLOAD_ERROR',
    });
  }

  if (err) {
    logger.error('Upload error:', err);
    if (err instanceof CustomError) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        errorCode: err.errorCode,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'File upload failed',
      errorCode: 'UPLOAD_FAILED',
    });
  }

  next();
};

export default upload;

