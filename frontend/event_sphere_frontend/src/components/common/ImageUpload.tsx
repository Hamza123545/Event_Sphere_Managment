/**
 * ImageUpload Component
 * Drag and drop image upload component with preview
 */

import { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Image as ImageIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { getActiveTheme } from '../../theme/designSystem';
import { useThemeStore } from '../../stores/themeStore';

const MotionBox = motion(Box);

interface ImageUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  accept?: string;
  maxSizeMB?: number;
  error?: string;
  previewUrl?: string; // For existing images
}

export default function ImageUpload({
  value,
  onChange,
  disabled = false,
  accept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp',
  maxSizeMB = 10,
  error,
  previewUrl,
}: ImageUploadProps) {
  const { mode } = useThemeStore();
  const activeTheme = getActiveTheme(mode);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(previewUrl || null);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      onChange(null);
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      onChange(null);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onChange(file);
  }, [onChange, maxSizeMB]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {preview || value ? (
        <Box
          sx={{
            position: 'relative',
            border: `2px dashed ${error ? activeTheme.error : activeTheme.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
            bgcolor: activeTheme.surface,
            minHeight: 200,
          }}
        >
          <Box
            component="img"
            src={preview || (value ? URL.createObjectURL(value) : '')}
            alt="Preview"
            sx={{
              width: '100%',
              height: 'auto',
              maxHeight: 400,
              objectFit: 'contain',
              display: 'block',
            }}
          />
          {!disabled && (
            <IconButton
              onClick={handleRemove}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: `${activeTheme.error}90`,
                color: '#fff',
                '&:hover': {
                  bgcolor: activeTheme.error,
                },
              }}
            >
              <Delete />
            </IconButton>
          )}
        </Box>
      ) : (
        <MotionBox
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          whileHover={!disabled ? { scale: 1.01 } : {}}
          whileTap={!disabled ? { scale: 0.99 } : {}}
          sx={{
            border: `2px dashed ${isDragging ? activeTheme.accent : error ? activeTheme.error : activeTheme.border}`,
            borderRadius: '12px',
            p: 4,
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            bgcolor: isDragging ? `${activeTheme.accent}10` : activeTheme.surface,
            transition: 'all 0.3s ease',
            '&:hover': !disabled ? {
              borderColor: activeTheme.accent,
              bgcolor: `${activeTheme.accent}10`,
            } : {},
          }}
        >
          <CloudUpload
            sx={{
              fontSize: 48,
              color: isDragging ? activeTheme.accent : activeTheme.textSecondary,
              mb: 2,
            }}
          />
          <Typography
            variant="h6"
            sx={{
              color: activeTheme.textPrimary,
              fontWeight: 600,
              mb: 1,
            }}
          >
            {isDragging ? 'Drop image here' : 'Upload Image'}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: activeTheme.textSecondary,
              mb: 2,
            }}
          >
            Drag and drop an image, or click to select
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ImageIcon />}
            disabled={disabled}
            sx={{
              borderColor: activeTheme.border,
              color: activeTheme.textPrimary,
              '&:hover': {
                borderColor: activeTheme.accent,
                bgcolor: `${activeTheme.accent}10`,
              },
            }}
          >
            Select Image
          </Button>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 2,
              color: activeTheme.textSecondary,
            }}
          >
            Supported formats: JPG, PNG, GIF, WEBP (Max {maxSizeMB}MB)
          </Typography>
        </MotionBox>
      )}

      {error && (
        <Typography
          variant="caption"
          sx={{
            color: activeTheme.error,
            mt: 1,
            display: 'block',
          }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}

