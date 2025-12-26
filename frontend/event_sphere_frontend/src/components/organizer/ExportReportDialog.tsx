/**
 * ExportReportDialog Component
 * Format selector (PDF/CSV/JSON), download button, progress indicator
 * Implements T191
 */

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  CircularProgress,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import { Download, PictureAsPdf, TableChart, DataObject } from '@mui/icons-material';
import {
  ActionButton,
  activeTheme,
} from '../../theme/designSystem';

interface ExportReportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (format: 'pdf' | 'csv' | 'json') => Promise<void>;
  isLoading?: boolean;
  expoTitle?: string;
}

export default function ExportReportDialog({
  open,
  onClose,
  onExport,
  isLoading = false,
  expoTitle,
}: ExportReportDialogProps) {
  const [format, setFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setError(null);
    try {
      await onExport(format);
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export report';
      setError(errorMessage);
    }
  };

  const getFormatIcon = (fmt: 'pdf' | 'csv' | 'json') => {
    switch (fmt) {
      case 'pdf':
        return <PictureAsPdf />;
      case 'csv':
        return <TableChart />;
      case 'json':
        return <DataObject />;
    }
  };

  const getFormatDescription = (fmt: 'pdf' | 'csv' | 'json') => {
    switch (fmt) {
      case 'pdf':
        return 'Portable Document Format - Best for printing and sharing';
      case 'csv':
        return 'Comma Separated Values - Best for data analysis in Excel';
      case 'json':
        return 'JSON Format - Best for programmatic access';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
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
        Export Analytics Report
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: activeTheme.surface }}>
        {expoTitle && (
          <Typography variant="body2" sx={{ color: activeTheme.textSecondary, mb: 3, fontWeight: 600 }}>
            Exporting analytics for: <span style={{ color: activeTheme.textPrimary, fontWeight: 700 }}>{expoTitle}</span>
          </Typography>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              bgcolor: `${activeTheme.error}20`,
              border: `1px solid ${activeTheme.error}30`,
              color: activeTheme.textPrimary
            }} 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend" sx={{ color: activeTheme.textPrimary, fontWeight: 700, mb: 2 }}>
            Select Export Format
          </FormLabel>
          <RadioGroup
            value={format}
            onChange={(e) => setFormat(e.target.value as 'pdf' | 'csv' | 'json')}
          >
            {(['pdf', 'csv', 'json'] as const).map((fmt) => (
              <FormControlLabel
                key={fmt}
                value={fmt}
                control={
                  <Radio 
                    sx={{
                      color: activeTheme.accent,
                      '&.Mui-checked': {
                        color: activeTheme.accent,
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ color: activeTheme.accent }}>
                      {getFormatIcon(fmt)}
                    </Box>
                    <Box>
                      <Typography variant="body1" sx={{ textTransform: 'uppercase', fontWeight: 800, color: activeTheme.textPrimary }}>
                        {fmt}
                      </Typography>
                      <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
                        {getFormatDescription(fmt)}
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ mb: 2, p: 2, bgcolor: activeTheme.surfaceLight, borderRadius: 2, border: `1px solid ${activeTheme.border}` }}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, bgcolor: activeTheme.surface, borderTop: `1px solid ${activeTheme.border}` }}>
        <ActionButton onClick={onClose} disabled={isLoading}>
          Cancel
        </ActionButton>
        <ActionButton
          onClick={handleExport}
          primary
          startIcon={isLoading ? <CircularProgress size={16} /> : <Download />}
          disabled={isLoading}
        >
          {isLoading ? 'Exporting...' : 'Download Report'}
        </ActionButton>
      </DialogActions>
    </Dialog>
  );
}

