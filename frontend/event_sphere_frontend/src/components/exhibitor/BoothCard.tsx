/**
 * BoothCard Component
 * Implements T084: User Story 2 - Booth details display with reserve button
 */

import { Typography, Chip, Box } from '@mui/material';
import { CheckCircle, Cancel, Schedule } from '@mui/icons-material';
import type { BoothDetails } from '../../types/exhibitor';
import {
  GlassCard,
  ActionButton,
  activeTheme,
  MotionBox,
} from '../../theme/designSystem';

interface BoothCardProps {
  booth: BoothDetails;
  onReserve?: () => void;
  canReserve?: boolean;
  highlighted?: boolean;
}

export default function BoothCard({ booth, onReserve, canReserve = false, highlighted = false }: BoothCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return activeTheme.success;
      case 'reserved':
        return activeTheme.warning;
      case 'occupied':
        return activeTheme.textSecondary;
      default:
        return activeTheme.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    const color = getStatusColor(status);
    switch (status) {
      case 'available':
        return <CheckCircle sx={{ fontSize: 16, color }} />;
      case 'reserved':
        return <Schedule sx={{ fontSize: 16, color }} />;
      case 'occupied':
        return <Cancel sx={{ fontSize: 16, color }} />;
      default:
        return null;
    }
  };

  const statusColor = getStatusColor(booth.status);

  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5 }}
    >
      <GlassCard
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          ...(highlighted && {
            border: `2px solid ${activeTheme.accent}`,
            boxShadow: `0 0 20px ${activeTheme.accentGlow}`,
            animation: 'pulse 0.5s ease-in-out',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.02)' },
            },
          }),
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: activeTheme.textPrimary }}>
              {booth.identifier}
            </Typography>
            <Chip
              icon={getStatusIcon(booth.status) as React.ReactElement}
              label={booth.status}
              size="small"
              sx={{
                bgcolor: `${statusColor}20`,
                color: statusColor,
                border: `1px solid ${statusColor}30`,
                fontWeight: 700
              }}
            />
          </Box>

          <Typography variant="body2" sx={{ mb: 1.5, color: activeTheme.textSecondary }}>
            <span style={{ fontWeight: 700, color: activeTheme.textPrimary }}>Size:</span> {booth.size.width}m × {booth.size.height}m
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: activeTheme.textSecondary }}>
            <span style={{ fontWeight: 700, color: activeTheme.textPrimary }}>Area:</span> {booth.size.area}m²
          </Typography>

          {booth.priceTier && (
            <Box sx={{ mb: 2 }}>
              <Chip 
                label={booth.priceTier} 
                size="small"
                sx={{
                  bgcolor: `${activeTheme.accent}20`,
                  color: activeTheme.accent,
                  border: `1px solid ${activeTheme.accent}30`,
                  fontWeight: 600
                }}
              />
            </Box>
          )}

          {booth.amenities.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 700, display: 'block', mb: 1 }}>
                AMENITIES:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {booth.amenities.map((amenity, index) => (
                  <Chip 
                    key={index} 
                    label={amenity} 
                    size="small"
                    sx={{
                      bgcolor: `${activeTheme.accent}20`,
                      color: activeTheme.accent,
                      border: `1px solid ${activeTheme.accent}30`,
                      fontWeight: 600
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {booth.exhibitor && (
            <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
              Reserved by: <span style={{ color: activeTheme.textPrimary }}>{booth.exhibitor.companyName}</span>
            </Typography>
          )}
        </Box>

        {canReserve && booth.status === 'available' && onReserve && (
          <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${activeTheme.border}`, display: 'flex', justifyContent: 'flex-end' }}>
            <ActionButton size="small" primary onClick={onReserve}>
              Reserve Booth
            </ActionButton>
          </Box>
        )}
      </GlassCard>
    </MotionBox>
  );
}

