import { Alert, AlertTitle, Snackbar } from '@mui/material';
import { useState, useEffect } from 'react';
import { activeTheme } from '../../theme/designSystem';

interface ErrorAlertProps {
  message: string;
  title?: string;
  severity?: 'error' | 'warning' | 'info' | 'success';
  autoHideDuration?: number;
  onClose?: () => void;
  sx?: any;
}

/**
 * ErrorAlert component
 * Displays error messages to users
 * Implements constitutional requirement for user-friendly error messages
 */
export function ErrorAlert({
  message,
  title,
  severity = 'error',
  autoHideDuration = 6000,
  onClose,
  sx,
}: ErrorAlertProps) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoHideDuration]);

  const handleClose = () => {
    setOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const getSeverityColor = () => {
    switch (severity) {
      case 'error':
        return activeTheme.error;
      case 'warning':
        return activeTheme.warning;
      case 'info':
        return activeTheme.info;
      case 'success':
        return activeTheme.success;
      default:
        return activeTheme.error;
    }
  };

  const severityColor = getSeverityColor();

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert 
        onClose={handleClose} 
        severity={severity} 
        sx={{ 
          width: '100%',
          bgcolor: `${severityColor}20`,
          border: `1px solid ${severityColor}30`,
          color: activeTheme.textPrimary,
          ...sx
        }}
      >
        {title && (
          <AlertTitle sx={{ color: activeTheme.textPrimary, fontWeight: 800 }}>
            {title}
          </AlertTitle>
        )}
        {message}
      </Alert>
    </Snackbar>
  );
}

export default ErrorAlert;

