/**
 * File Upload Service
 * Handles file storage and URL generation
 * Implements FR-019 (file upload handling)
 */

import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';
import { CustomError } from '../middleware/errorHandler';

const UPLOADS_BASE_DIR = path.join(process.cwd(), 'uploads');
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const UPLOADS_PUBLIC_PATH = '/uploads';

export interface UploadedFileInfo {
  filename: string;
  originalName: string;
  url: string;
  path: string;
  size: number;
  mimetype: string;
}

/**
 * Generate public URL for uploaded file
 */
export function generateFileUrl(relativePath: string): string {
  // Convert backslashes to forward slashes for URLs (Windows compatibility)
  const normalizedPath = relativePath.replace(/\\/g, '/');
  return `${BASE_URL}${UPLOADS_PUBLIC_PATH}/${normalizedPath}`;
}

/**
 * Save uploaded file info and return URL
 */
export function saveFileInfo(file: Express.Multer.File): UploadedFileInfo {
  try {
    // Calculate relative path from uploads directory
    const fullPath = file.path;
    const uploadsDirIndex = fullPath.indexOf('uploads');
    const relativePath = fullPath.substring(uploadsDirIndex + 'uploads'.length + 1);
    
    const url = generateFileUrl(relativePath);

    logger.info('File uploaded successfully', {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });

    return {
      filename: file.filename,
      originalName: file.originalname,
      url,
      path: relativePath,
      size: file.size,
      mimetype: file.mimetype,
    };
  } catch (error) {
    logger.error('Error saving file info:', error);
    throw new CustomError('Failed to process uploaded file', 500, 'FILE_PROCESSING_ERROR');
  }
}

/**
 * Delete file from storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const fullPath = path.join(UPLOADS_BASE_DIR, filePath);
    
    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
      logger.info('File deleted successfully', { filePath });
    } else {
      logger.warn('File not found for deletion', { filePath });
    }
  } catch (error) {
    logger.error('Error deleting file:', error);
    throw new CustomError('Failed to delete file', 500, 'FILE_DELETE_ERROR');
  }
}

/**
 * Extract file path from URL
 */
export function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlPath = new URL(url).pathname;
    const uploadsIndex = urlPath.indexOf(UPLOADS_PUBLIC_PATH);
    
    if (uploadsIndex === -1) {
      return null;
    }
    
    const relativePath = urlPath.substring(uploadsIndex + UPLOADS_PUBLIC_PATH.length + 1);
    return relativePath;
  } catch (error) {
    logger.error('Error extracting file path from URL:', error);
    return null;
  }
}

/**
 * Validate file exists
 */
export function fileExists(filePath: string): boolean {
  const fullPath = path.join(UPLOADS_BASE_DIR, filePath);
  return fs.existsSync(fullPath);
}

