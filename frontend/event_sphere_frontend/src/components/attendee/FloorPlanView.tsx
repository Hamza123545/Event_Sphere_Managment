/**
 * FloorPlanView Component
 * Read-only floor plan view for attendees
 * Implements T111: User Story 3
 */

import { Box, Paper, Typography, Alert, Button } from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import type { ExhibitorSearchResult } from '../../types/attendee';

interface FloorPlanViewProps {
  floorPlan: {
    floorPlanId: string;
    name: string;
    dimensions: {
      width: number;
      height: number;
    };
    imageUrl?: string;
    metadata: {
      scale: number;
      totalBooths: number;
      availableBooths: number;
    };
  };
  exhibitors?: ExhibitorSearchResult[];
  onBoothClick?: (exhibitorId: string) => void;
}

export default function FloorPlanView({ floorPlan, exhibitors = [], onBoothClick }: FloorPlanViewProps) {
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {floorPlan.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Dimensions: {floorPlan.dimensions.width}m × {floorPlan.dimensions.height}m
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Booths: {floorPlan.metadata.totalBooths} • Available: {floorPlan.metadata.availableBooths}
        </Typography>
      </Paper>

      {floorPlan.imageUrl ? (
        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'hidden',
            bgcolor: 'action.hover',
            position: 'relative',
            minHeight: 400,
            mb: 3,
          }}
        >
          <Box
            component="img"
            src={floorPlan.imageUrl}
            alt={floorPlan.name}
            sx={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
          />
          {/* Note: For interactive floor plan, you would overlay clickable booth areas here */}
        </Box>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          Floor plan image not available. Please check back later.
        </Alert>
      )}

      {/* Exhibitor Booths List */}
      {exhibitors.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Exhibitor Booths
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
            {exhibitors
              .filter((ex) => ex.booth)
              .map((exhibitor) => (
                <Button
                  key={exhibitor.profileId}
                  variant="outlined"
                  startIcon={<LocationOn />}
                  onClick={() => onBoothClick?.(exhibitor.profileId)}
                  sx={{ mb: 1 }}
                >
                  {exhibitor.companyName} - Booth {exhibitor.booth?.identifier}
                </Button>
              ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}

