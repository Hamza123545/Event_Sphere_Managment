/**
 * ExpoDirectory Component
 * Implements T079: User Story 2 - List available expos, filter by status/category, register button
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import { useExhibitorStore } from '../../stores/exhibitorStore';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import type { ExpoSummary } from '../../types/expo';
import {
  GlassCard,
  GlassContainer,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

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
      <GlassContainer sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Search expos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: activeTheme.textSecondary }} />,
            }}
            sx={{ 
              flexGrow: 1, 
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                bgcolor: activeTheme.surface,
                color: activeTheme.textPrimary,
                '& fieldset': {
                  borderColor: activeTheme.border,
                },
                '&:hover fieldset': {
                  borderColor: activeTheme.accent,
                },
              },
            }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: activeTheme.textSecondary }}>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value as any)}
              sx={{
                bgcolor: activeTheme.surface,
                color: activeTheme.textPrimary,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: activeTheme.border,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: activeTheme.accent,
                },
              }}
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
            sx={{ 
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                bgcolor: activeTheme.surface,
                color: activeTheme.textPrimary,
                '& fieldset': {
                  borderColor: activeTheme.border,
                },
                '&:hover fieldset': {
                  borderColor: activeTheme.accent,
                },
              },
            }}
          />
        </Box>
      </GlassContainer>

      {error && <ErrorAlert message={error} onClose={clearError} severity="error" />}

      {isLoading && availableExpos.length === 0 ? (
        <LoadingSpinner />
      ) : filteredExpos.length === 0 ? (
        <GlassCard>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{ color: activeTheme.textSecondary }}>
              No expos found matching your criteria.
            </Typography>
          </Box>
        </GlassCard>
      ) : (
        <Grid container spacing={3}>
          {filteredExpos.map((expo: ExpoSummary, index: number) => (
            <Grid item xs={12} sm={6} md={4} key={expo.expoId}>
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <GlassCard sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 0, overflow: 'hidden' }}>
                  {/* Expo Image */}
                  {expo.imageUrl && (
                    <Box
                      component="img"
                      src={expo.imageUrl}
                      alt={expo.title}
                      sx={{
                        width: '100%',
                        height: 180,
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  )}
                  <Box sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, flex: 1, color: activeTheme.textPrimary }}>
                        {expo.title}
                      </Typography>
                      <Chip 
                        label={expo.status} 
                        size="small"
                        sx={{
                          ml: 1,
                          bgcolor: `${activeTheme.accent}20`,
                          color: activeTheme.accent,
                          border: `1px solid ${activeTheme.accent}30`,
                          fontWeight: 700
                        }}
                      />
                    </Box>

                    {expo.theme && (
                      <Typography variant="body2" sx={{ color: activeTheme.textSecondary, mb: 1.5, fontWeight: 600 }}>
                        Theme: <span style={{ color: activeTheme.textPrimary }}>{expo.theme}</span>
                      </Typography>
                    )}

                    {expo.dateRange && (
                      <Typography variant="body2" sx={{ mb: 1.5, color: activeTheme.textSecondary }}>
                        <span style={{ fontWeight: 700, color: activeTheme.textPrimary }}>Dates:</span> {formatDate(expo.dateRange.startDate)} -{' '}
                        {formatDate(expo.dateRange.endDate)}
                      </Typography>
                    )}

                    {expo.location && (
                      <Typography variant="body2" sx={{ mb: 2, color: activeTheme.textSecondary }}>
                        <span style={{ fontWeight: 700, color: activeTheme.textPrimary }}>Location:</span> {expo.location.city}, {expo.location.country}
                      </Typography>
                    )}
                  </Box>
                  </Box>

                  <Box sx={{ mt: 'auto', pt: 3, px: 3, pb: 3, borderTop: `1px solid ${activeTheme.border}`, display: 'flex', justifyContent: 'flex-end' }}>
                    <ActionButton
                      size="small"
                      primary
                      startIcon={<Add />}
                      onClick={() => onRegister(expo.expoId)}
                    >
                      Register
                    </ActionButton>
                  </Box>
                </GlassCard>
              </MotionBox>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

