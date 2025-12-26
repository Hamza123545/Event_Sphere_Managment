/**
 * InteractiveFloorPlan Component
 * SVG/canvas floor plan with booth visualization
 * Implements T127: User Story 4
 */

import { Box, Typography, Chip, Tooltip, Alert } from '@mui/material';
import { Add } from '@mui/icons-material';
import type { FloorPlanDetail, BoothSpace } from '../../types/floorPlan';
import {
  GlassCard,
  ActionButton,
  activeTheme,
} from '../../theme/designSystem';

interface InteractiveFloorPlanProps {
  floorPlan: FloorPlanDetail;
  onBoothClick?: (booth: BoothSpace) => void;
  onAddBooth?: () => void;
  selectedBoothId?: string;
}

export default function InteractiveFloorPlan({
  floorPlan,
  onBoothClick,
  onAddBooth,
  selectedBoothId,
}: InteractiveFloorPlanProps) {
  const scale = floorPlan.metadata.scale || 10; // pixels per meter

  // Calculate SVG dimensions in pixels
  const svgWidth = floorPlan.dimensions.width * scale;
  const svgHeight = floorPlan.dimensions.height * scale;

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'available':
        return activeTheme.success;
      case 'reserved':
        return activeTheme.warning;
      case 'occupied':
        return activeTheme.accent;
      default:
        return activeTheme.textSecondary;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'reserved':
        return 'Reserved';
      case 'occupied':
        return 'Occupied';
      default:
        return status;
    }
  };

  return (
    <Box>
      {/* Floor Plan Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: activeTheme.textPrimary }}>
          {floorPlan.name}
        </Typography>
        {onAddBooth && (
          <ActionButton primary startIcon={<Add />} onClick={onAddBooth}>
            Add Booth
          </ActionButton>
        )}
      </Box>

      {/* Metadata */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Chip 
          label={`Total: ${floorPlan.metadata.totalBooths}`}
          sx={{
            bgcolor: `${activeTheme.accent}20`,
            color: activeTheme.accent,
            border: `1px solid ${activeTheme.accent}30`,
            fontWeight: 700
          }}
        />
        <Chip 
          label={`Available: ${floorPlan.metadata.availableBooths}`}
          sx={{
            bgcolor: `${activeTheme.success}20`,
            color: activeTheme.success,
            border: `1px solid ${activeTheme.success}30`,
            fontWeight: 700
          }}
        />
        <Chip
          label={`Reserved: ${floorPlan.booths.filter((b) => b.status === 'reserved').length}`}
          sx={{
            bgcolor: `${activeTheme.warning}20`,
            color: activeTheme.warning,
            border: `1px solid ${activeTheme.warning}30`,
            fontWeight: 700
          }}
        />
        <Chip
          label={`Occupied: ${floorPlan.booths.filter((b) => b.status === 'occupied').length}`}
          sx={{
            bgcolor: `${activeTheme.accent}20`,
            color: activeTheme.accent,
            border: `1px solid ${activeTheme.accent}30`,
            fontWeight: 700
          }}
        />
      </Box>

      {/* Status Legend */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 24, height: 24, bgcolor: activeTheme.success, borderRadius: 1, boxShadow: `0 0 8px ${activeTheme.success}80` }} />
          <Typography variant="body2" sx={{ color: activeTheme.textPrimary, fontWeight: 600 }}>Available</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 24, height: 24, bgcolor: activeTheme.warning, borderRadius: 1, boxShadow: `0 0 8px ${activeTheme.warning}80` }} />
          <Typography variant="body2" sx={{ color: activeTheme.textPrimary, fontWeight: 600 }}>Reserved</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 24, height: 24, bgcolor: activeTheme.accent, borderRadius: 1, boxShadow: `0 0 8px ${activeTheme.accent}80` }} />
          <Typography variant="body2" sx={{ color: activeTheme.textPrimary, fontWeight: 600 }}>Occupied</Typography>
        </Box>
      </Box>

      {/* SVG Floor Plan */}
      <GlassCard sx={{ p: 3, overflow: 'auto', maxHeight: '70vh' }}>
        {floorPlan.imageUrl ? (
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 'auto',
              border: `2px solid ${activeTheme.border}`,
              borderRadius: 2,
            }}
          >
            <Box
              component="img"
              src={floorPlan.imageUrl}
              alt={floorPlan.name}
              sx={{ width: '100%', height: 'auto', display: 'block' }}
            />
            {/* Overlay SVG for interactive booths */}
            <Box
              component="svg"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            >
              {floorPlan.booths.map((booth) => {
                const x = booth.location.x * scale;
                const y = booth.location.y * scale;
                const width = booth.size.width * scale;
                const height = booth.size.height * scale;
                const isSelected = selectedBoothId === booth.boothId;

                return (
                  <Tooltip
                    key={booth.boothId}
                    title={
                      <Box>
                        <Typography variant="subtitle2">{booth.identifier}</Typography>
                        <Typography variant="caption">
                          {booth.size.width}m × {booth.size.height}m
                        </Typography>
                        {booth.exhibitor && (
                          <Typography variant="caption">Occupied by: {booth.exhibitor.companyName}</Typography>
                        )}
                      </Box>
                    }
                    arrow
                  >
                    <Box
                      component="rect"
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={getStatusColor(booth.status)}
                      fillOpacity={0.6}
                      stroke={isSelected ? activeTheme.accentGlow : activeTheme.border}
                      strokeWidth={isSelected ? 3 : 1}
                      sx={{
                        cursor: onBoothClick ? 'pointer' : 'default',
                        pointerEvents: 'all',
                      }}
                      onClick={() => onBoothClick?.(booth)}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        ) : (
          <Box
            component="svg"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            sx={{
              width: '100%',
              height: 'auto',
              border: `2px solid ${activeTheme.border}`,
              borderRadius: 2,
              bgcolor: activeTheme.surfaceLight,
              minHeight: 400,
            }}
          >
            {/* Floor background */}
            <rect width={svgWidth} height={svgHeight} fill={activeTheme.surfaceLight} />

            {/* Draw booths */}
            {floorPlan.booths.map((booth) => {
              const x = booth.location.x * scale;
              const y = booth.location.y * scale;
              const width = booth.size.width * scale;
              const height = booth.size.height * scale;
              const isSelected = selectedBoothId === booth.boothId;

              return (
                <g key={booth.boothId}>
                  <Tooltip title={`${booth.identifier} - ${getStatusLabel(booth.status)}`}>
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill={getStatusColor(booth.status)}
                      fillOpacity={0.6}
                      stroke={isSelected ? activeTheme.accentGlow : activeTheme.border}
                      strokeWidth={isSelected ? 3 : 1}
                      style={{ cursor: onBoothClick ? 'pointer' : 'default' }}
                      onClick={() => onBoothClick?.(booth)}
                    />
                  </Tooltip>
                  {/* Booth label */}
                  <text
                    x={x + width / 2}
                    y={y + height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fill={activeTheme.textPrimary}
                    fontWeight="bold"
                  >
                    {booth.identifier}
                  </text>
                </g>
              );
            })}
          </Box>
        )}
      </GlassCard>

      {floorPlan.booths.length === 0 && (
        <Alert 
          severity="info" 
          sx={{ 
            mt: 3,
            bgcolor: `${activeTheme.info}20`,
            border: `1px solid ${activeTheme.info}30`,
            color: activeTheme.textPrimary
          }}
        >
          No booths added yet. Click "Add Booth" to start creating booth spaces.
        </Alert>
      )}
    </Box>
  );
}

