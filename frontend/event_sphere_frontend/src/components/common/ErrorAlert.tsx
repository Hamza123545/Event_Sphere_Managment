import { Alert, AlertTitle, Snackbar } from '@mui/material';
import { useState, useEffect } from 'react';

interface ErrorAlertProps {
  message: string;
  title?: string;
  severity?: 'error' | 'warning' | 'info' | 'success';
  autoHideDuration?: number;
  onClose?: () => void;
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

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
}

export default ErrorAlert;

