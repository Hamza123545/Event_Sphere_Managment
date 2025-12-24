/**
 * Expo Directory Page
 * Browse and filter available expos for attendees
 * Implements T103: User Story 3
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { useAttendeeStore } from '../../stores/attendeeStore';

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
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <AppBar title="Attendee Portal" />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Browse Expos
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Discover and register for exciting expo events
        </Typography>

        {/* Filters */}
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
          <TextField
            placeholder="Location (City/Country)"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          />
        </Box>

        {error && <ErrorAlert message={error} onClose={clearError} severity="error" />}

        {isLoading && expos.length === 0 ? (
          <LoadingSpinner />
        ) : filteredExpos.length === 0 ? (
          <Alert severity="info">No expos found matching your criteria.</Alert>
        ) : (
          <Grid container spacing={3}>
            {filteredExpos.map((expo) => (
              <Grid item xs={12} sm={6} md={4} key={expo.expoId}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', flex: 1 }}>
                        {expo.title}
                      </Typography>
                      <Chip label={expo.status} color="primary" size="small" sx={{ ml: 1 }} />
                    </Box>


                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Dates:</strong> {formatDate(expo.dateRange.startDate)} -{' '}
                      {formatDate(expo.dateRange.endDate)}
                    </Typography>

                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Location:</strong> {expo.location.city}, {expo.location.country}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => navigate(`/attendee/expo/${expo.expoId}`)}
                    >
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}

