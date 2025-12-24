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
  Button,
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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export report');
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Export Analytics Report</DialogTitle>
      <DialogContent dividers>
        {expoTitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Exporting analytics for: <strong>{expoTitle}</strong>
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend">Select Export Format</FormLabel>
          <RadioGroup
            value={format}
            onChange={(e) => setFormat(e.target.value as 'pdf' | 'csv' | 'json')}
          >
            {(['pdf', 'csv', 'json'] as const).map((fmt) => (
              <FormControlLabel
                key={fmt}
                value={fmt}
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getFormatIcon(fmt)}
                    <Box>
                      <Typography variant="body1" sx={{ textTransform: 'uppercase', fontWeight: 'medium' }}>
                        {fmt}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getFormatDescription(fmt)}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          startIcon={isLoading ? <CircularProgress size={16} /> : <Download />}
          disabled={isLoading}
        >
          {isLoading ? 'Exporting...' : 'Download Report'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

