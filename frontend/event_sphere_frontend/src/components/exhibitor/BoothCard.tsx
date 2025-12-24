/**
 * BoothCard Component
 * Implements T084: User Story 2 - Booth details display with reserve button
 */

import { Card, CardContent, CardActions, Typography, Button, Chip, Box } from '@mui/material';
import { CheckCircle, Cancel, Schedule } from '@mui/icons-material';
import type { BoothDetails } from '../../types/exhibitor';

interface BoothCardProps {
  booth: BoothDetails;
  onReserve?: () => void;
  canReserve?: boolean;
  highlighted?: boolean;
}

export default function BoothCard({ booth, onReserve, canReserve = false, highlighted = false }: BoothCardProps) {
  const getStatusColor = (status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'available':
        return 'success';
      case 'reserved':
        return 'warning';
      case 'occupied':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle fontSize="small" />;
      case 'reserved':
        return <Schedule fontSize="small" />;
      case 'occupied':
        return <Cancel fontSize="small" />;
      default:
        return null;
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...(highlighted && {
          border: 2,
          borderColor: 'primary.main',
          boxShadow: 3,
          animation: 'pulse 0.5s ease-in-out',
          '@keyframes pulse': {
            '0%, 100%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.02)' },
          },
        }),
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
            {booth.identifier}
          </Typography>
          <Chip
            icon={getStatusIcon(booth.status) as React.ReactElement}
            label={booth.status}
            color={getStatusColor(booth.status)}
            size="small"
          />
        </Box>

        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Size:</strong> {booth.size.width}m × {booth.size.height}m
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Area:</strong> {booth.size.area}m²
        </Typography>

        {booth.priceTier && (
          <Box sx={{ mb: 1 }}>
            <Chip label={booth.priceTier} size="small" variant="outlined" />
          </Box>
        )}

        {booth.amenities.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Amenities:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {booth.amenities.map((amenity, index) => (
                <Chip key={index} label={amenity} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}

        {booth.exhibitor && (
          <Typography variant="caption" color="text.secondary">
            Reserved by: {booth.exhibitor.companyName}
          </Typography>
        )}
      </CardContent>

      {canReserve && booth.status === 'available' && onReserve && (
        <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
          <Button size="small" variant="contained" onClick={onReserve}>
            Reserve Booth
          </Button>
        </CardActions>
      )}
    </Card>
  );
}

