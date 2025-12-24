/**
 * ExpoDirectory Component
 * Implements T079: User Story 2 - List available expos, filter by status/category, register button
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import { useExhibitorStore } from '../../stores/exhibitorStore';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import type { ExpoSummary } from '../../types/expo';

interface ExpoDirectoryProps {
  onRegister: (expoId: string) => void;
}

export default function ExpoDirectory({ onRegister }: ExpoDirectoryProps) {
  const { availableExpos, isLoading, error, browseExpos, clearError } = useExhibitorStore();
  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'active' | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    browseExpos({
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
    });
  }, [statusFilter, categoryFilter, browseExpos]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredExpos = availableExpos.filter((expo) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        expo.title.toLowerCase().includes(searchLower) ||
        expo.theme?.toLowerCase().includes(searchLower) ||
        expo.location.city.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="Search expos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="upcoming">Upcoming</MenuItem>
            <MenuItem value="active">Active</MenuItem>
          </Select>
        </FormControl>
        <TextField
          placeholder="Category/Theme"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        />
      </Box>

      {error && <ErrorAlert message={error} onClose={clearError} severity="error" />}

      {isLoading && availableExpos.length === 0 ? (
        <LoadingSpinner />
      ) : filteredExpos.length === 0 ? (
        <Alert severity="info">No expos found matching your criteria.</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredExpos.map((expo: ExpoSummary) => (
            <Grid item xs={12} sm={6} md={4} key={expo.expoId}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', flex: 1 }}>
                      {expo.title}
                    </Typography>
                    <Chip label={expo.status} color="primary" size="small" sx={{ ml: 1 }} />
                  </Box>

                  {expo.theme && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Theme: {expo.theme}
                    </Typography>
                  )}

                  {expo.dateRange && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Dates:</strong> {formatDate(expo.dateRange.startDate)} -{' '}
                      {formatDate(expo.dateRange.endDate)}
                    </Typography>
                  )}

                  {expo.location && (
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Location:</strong> {expo.location.city}, {expo.location.country}
                    </Typography>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => onRegister(expo.expoId)}
                  >
                    Register
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

