/**
 * ExhibitorProfile Component
 * Displays detailed exhibitor profile for attendees
 * Implements T109: User Story 3
 */

import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
  Button,
  Divider,
} from '@mui/material';
import { Business, LocationOn } from '@mui/icons-material';
import type { ExhibitorSearchResult } from '../../types/attendee';

interface ExhibitorProfileProps {
  exhibitor: ExhibitorSearchResult;
  onContact?: () => void;
}

export default function ExhibitorProfile({ exhibitor, onContact }: ExhibitorProfileProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'start', gap: 3, mb: 3 }}>
          {exhibitor.logo ? (
            <Avatar src={exhibitor.logo} alt={exhibitor.companyName} sx={{ width: 80, height: 80 }} />
          ) : (
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}>
              <Business sx={{ fontSize: 40 }} />
            </Avatar>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {exhibitor.companyName}
            </Typography>
            <Chip label={exhibitor.category} color="primary" sx={{ mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              {exhibitor.description}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Products/Services */}
        {exhibitor.productsServices.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Products & Services
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {exhibitor.productsServices.map((product, index) => (
                <Chip key={index} label={product} variant="outlined" />
              ))}
            </Box>
          </Box>
        )}

        {/* Booth Location */}
        {exhibitor.booth && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocationOn color="primary" />
              <Typography variant="h6">Booth Location</Typography>
            </Box>
            <Typography variant="body1">
              Booth: <strong>{exhibitor.booth.identifier}</strong>
            </Typography>
            {exhibitor.booth.location && (
              <Typography variant="body2" color="text.secondary">
                Location: ({exhibitor.booth.location.x}, {exhibitor.booth.location.y})
              </Typography>
            )}
          </Box>
        )}

        {/* Contact Button */}
        {onContact && (
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" size="large" onClick={onContact}>
              Contact Exhibitor
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

