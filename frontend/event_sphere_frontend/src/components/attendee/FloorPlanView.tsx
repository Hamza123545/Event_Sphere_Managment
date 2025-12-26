/**
 * FloorPlanView Component
 * Read-only floor plan view for attendees
 * Implements T111: User Story 3
 */

import { Box, Typography, Alert } from '@mui/material';
import { LocationOn } from '@mui/icons-material';
import type { ExhibitorSearchResult } from '../../types/attendee';
import {
  GlassCard,
  GlassContainer,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

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
      <GlassCard sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: activeTheme.textPrimary }}>
          {floorPlan.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 700, display: 'block', mb: 0.5 }}>
              DIMENSIONS
            </Typography>
            <Typography variant="body2" sx={{ color: activeTheme.textPrimary, fontWeight: 600 }}>
              {floorPlan.dimensions.width}m × {floorPlan.dimensions.height}m
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 700, display: 'block', mb: 0.5 }}>
              BOOTHS
            </Typography>
            <Typography variant="body2" sx={{ color: activeTheme.textPrimary, fontWeight: 600 }}>
              Total: {floorPlan.metadata.totalBooths} • Available: {floorPlan.metadata.availableBooths}
            </Typography>
          </Box>
        </Box>
      </GlassCard>

      {floorPlan.imageUrl ? (
        <GlassContainer sx={{ mb: 4, p: 0, overflow: 'hidden' }}>
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
        </GlassContainer>
      ) : (
        <GlassCard sx={{ mb: 4 }}>
          <Alert 
            severity="info" 
            sx={{ 
              bgcolor: `${activeTheme.info}20`,
              border: `1px solid ${activeTheme.info}30`,
              color: activeTheme.textPrimary
            }}
          >
            Floor plan image not available. Please check back later.
          </Alert>
        </GlassCard>
      )}

      {/* Exhibitor Booths List */}
      {exhibitors.length > 0 && (
        <GlassCard>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3, color: activeTheme.textPrimary }}>
            Exhibitor Booths
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {exhibitors
              .filter((ex) => ex.booth)
              .map((exhibitor, index) => (
                <MotionBox
                  key={exhibitor.profileId}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ActionButton
                    startIcon={<LocationOn />}
                    onClick={() => onBoothClick?.(exhibitor.profileId)}
                  >
                    {exhibitor.companyName} - Booth {exhibitor.booth?.identifier}
                  </ActionButton>
                </MotionBox>
              ))}
          </Box>
        </GlassCard>
      )}
    </Box>
  );
}

