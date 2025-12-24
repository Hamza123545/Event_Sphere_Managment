/**
 * InteractiveFloorPlan Component
 * SVG/canvas floor plan with booth visualization
 * Implements T127: User Story 4
 */

import { Box, Paper, Typography, Button, Chip, Tooltip, Alert } from '@mui/material';
import { Add, Edit } from '@mui/icons-material';
import type { FloorPlanDetail, BoothSpace } from '../../types/floorPlan';

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
        return '#4caf50'; // green
      case 'reserved':
        return '#ff9800'; // orange
      case 'occupied':
        return '#2196f3'; // blue
      default:
        return '#9e9e9e'; // grey
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">{floorPlan.name}</Typography>
        {onAddBooth && (
          <Button variant="contained" startIcon={<Add />} onClick={onAddBooth}>
            Add Booth
          </Button>
        )}
      </Box>

      {/* Metadata */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Chip label={`Total: ${floorPlan.metadata.totalBooths}`} />
        <Chip label={`Available: ${floorPlan.metadata.availableBooths}`} color="success" />
        <Chip
          label={`Reserved: ${floorPlan.booths.filter((b) => b.status === 'reserved').length}`}
          color="warning"
        />
        <Chip
          label={`Occupied: ${floorPlan.booths.filter((b) => b.status === 'occupied').length}`}
          color="primary"
        />
      </Box>

      {/* Status Legend */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: '#4caf50', borderRadius: 0.5 }} />
          <Typography variant="caption">Available</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: '#ff9800', borderRadius: 0.5 }} />
          <Typography variant="caption">Reserved</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: '#2196f3', borderRadius: 0.5 }} />
          <Typography variant="caption">Occupied</Typography>
        </Box>
      </Box>

      {/* SVG Floor Plan */}
      <Paper sx={{ p: 2, overflow: 'auto', maxHeight: '70vh' }}>
        {floorPlan.imageUrl ? (
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 'auto',
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
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
                      stroke={isSelected ? '#ff0000' : '#000'}
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
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'action.hover',
              minHeight: 400,
            }}
          >
            {/* Floor background */}
            <rect width={svgWidth} height={svgHeight} fill="#f5f5f5" />

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
                      stroke={isSelected ? '#ff0000' : '#000'}
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
                    fill="#000"
                    fontWeight="bold"
                  >
                    {booth.identifier}
                  </text>
                </g>
              );
            })}
          </Box>
        )}
      </Paper>

      {floorPlan.booths.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No booths added yet. Click "Add Booth" to start creating booth spaces.
        </Alert>
      )}
    </Box>
  );
}

