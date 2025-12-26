/**
 * Expo Directory Page
 * Browse and filter available expos for attendees
 * Implements T103: User Story 3
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { Search, LocationOn, Event, LocalFireDepartment } from '@mui/icons-material';
import ModernNavbar from '../../components/common/ModernNavbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { useAttendeeStore } from '../../stores/attendeeStore';
import {
  PageContainer,
  BackgroundGlows,
  GlassCard,
  GlassContainer,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

export default function ExpoDirectoryPage() {
  const navigate = useNavigate();
  const { expos, isLoading, error, browseExpos, clearError } = useAttendeeStore();
  const [statusFilter, setStatusFilter] = useState<'upcoming' | 'active' | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    browseExpos({
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
      location: locationFilter || undefined,
    });
  }, [statusFilter, categoryFilter, locationFilter, browseExpos]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredExpos = expos.filter((expo) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        expo.title.toLowerCase().includes(searchLower) ||
        expo.location.city.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <PageContainer>
      <BackgroundGlows />
      <ModernNavbar navItems={[
        { label: 'Explore', path: '/attendee/expos' },
        { label: 'My Events', path: '/attendee' },
      ]} />
      
      <Box sx={{ mt: 8, position: 'relative', zIndex: 1, maxWidth: '1400px', mx: 'auto', px: { xs: 3, md: 8 } }}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ mb: 6 }}
        >
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 1.5, letterSpacing: '-2px' }}>
            Browse Expos
          </Typography>
          <Typography variant="h6" sx={{ color: activeTheme.textSecondary, fontWeight: 500 }}>
            Discover and register for exciting expo events
          </Typography>
        </MotionBox>

        {/* Filters */}
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
                '& .MuiInputLabel-root': {
                  color: activeTheme.textSecondary,
                },
              }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel sx={{ color: activeTheme.textSecondary }}>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value as 'upcoming' | 'active' | '')}
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
            <TextField
              placeholder="Location (City/Country)"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
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

        {error && (
          <Box sx={{ mb: 4 }}>
            <ErrorAlert message={error} onClose={clearError} severity="error" />
          </Box>
        )}

        {isLoading && expos.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
            <LoadingSpinner />
          </Box>
        ) : filteredExpos.length === 0 ? (
          <GlassCard>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography sx={{ color: activeTheme.textSecondary, mb: 2 }}>
                No expos found matching your criteria.
              </Typography>
            </Box>
          </GlassCard>
        ) : (
          <Grid container spacing={3}>
            {filteredExpos.map((expo, i) => (
              <Grid item xs={12} sm={6} md={4} key={expo.expoId}>
                <MotionBox
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <GlassCard 
                    sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                    onClick={() => navigate(`/attendee/expos/${expo.expoId}`)}
                  >
                    <Box sx={{ 
                      height: 180, 
                      position: 'relative', 
                      overflow: 'hidden',
                      background: `linear-gradient(135deg, ${activeTheme.accent}20 0%, ${activeTheme.accent}10 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <Box sx={{ position: 'absolute', top: 12, left: 12 }}>
                        <Chip 
                          label={expo.status === 'active' ? 'Live' : expo.status} 
                          size="small"
                          {...(expo.status === 'active' && { icon: <LocalFireDepartment /> })}
                          sx={{ 
                            bgcolor: expo.status === 'active' ? activeTheme.error : activeTheme.accent, 
                            color: '#fff', 
                            fontWeight: 800, 
                            backdropFilter: 'blur(4px)' 
                          }} 
                        />
                      </Box>
                      <Event sx={{ fontSize: 64, color: activeTheme.accent, opacity: 0.3 }} />
                    </Box>
                    <Box sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: activeTheme.textPrimary }}>
                        {expo.title}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, color: activeTheme.textSecondary }}>
                        <Event sx={{ fontSize: 16 }} />
                        <Typography variant="caption">
                          {formatDate(expo.dateRange.startDate)} - {formatDate(expo.dateRange.endDate)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, color: activeTheme.textSecondary }}>
                        <LocationOn sx={{ fontSize: 16 }} />
                        <Typography variant="caption">
                          {expo.location.city}, {expo.location.country}
                        </Typography>
                      </Box>
                      <ActionButton 
                        primary 
                        fullWidth
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          navigate(`/attendee/expos/${expo.expoId}`);
                        }}
                      >
                        View Details
                      </ActionButton>
                    </Box>
                  </GlassCard>
                </MotionBox>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </PageContainer>
  );
}

