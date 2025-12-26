import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ActionButton,
  activeTheme,
} from '../../theme/designSystem';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  severity?: 'info' | 'warning' | 'error';
  isLoading?: boolean;
}

/**
 * ConfirmDialog component
 * Reusable confirmation dialog for user actions
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  severity = 'warning',
  isLoading = false,
}: ConfirmDialogProps) {

  return (
    <Dialog 
      open={open} 
      onClose={onCancel} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: activeTheme.surface,
          border: `1px solid ${activeTheme.border}`,
        }
      }}
    >
      <DialogTitle sx={{ color: activeTheme.textPrimary, fontWeight: 800 }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ bgcolor: activeTheme.surface }}>
        <DialogContentText sx={{ color: activeTheme.textSecondary }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ bgcolor: activeTheme.surface, borderTop: `1px solid ${activeTheme.border}` }}>
        <ActionButton onClick={onCancel} disabled={isLoading}>
          {cancelText}
        </ActionButton>
        <ActionButton 
          onClick={onConfirm}
          disabled={isLoading}
          primary={severity !== 'error'}
          sx={severity === 'error' ? {
            color: activeTheme.error,
            border: `1px solid ${activeTheme.error}30`,
            '&:hover': { bgcolor: `${activeTheme.error}20` },
            '&:disabled': {
              color: `${activeTheme.error}60`,
              border: `1px solid ${activeTheme.error}20`,
            }
          } : {}}
        >
          {confirmText}
        </ActionButton>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDialog;

