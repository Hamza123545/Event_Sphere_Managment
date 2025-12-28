/**
 * AttendeeCountWidget Component
 * Displays total, registered, checked-in counts with pie chart
 * Implements T190
 */

import { Typography, Box, Grid } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { AttendeeCountMetrics } from '../../types/analytics';
import {
  GlassCard,
  activeTheme,
} from '../../theme/designSystem';

interface AttendeeCountWidgetProps {
  data: AttendeeCountMetrics;
}

const COLORS = [activeTheme.accent, activeTheme.success, activeTheme.warning, activeTheme.error];

export default function AttendeeCountWidget({ data }: AttendeeCountWidgetProps) {
  const chartData = [
    { name: 'Registered', value: data.registered, color: COLORS[0] },
    { name: 'Checked In', value: data.checkedIn, color: COLORS[1] },
    { name: 'No Show', value: data.noShow, color: COLORS[2] },
  ].filter((item) => item.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = data.payload.percentage
        ? `${data.payload.percentage.toFixed(1)}%`
        : '';
      return (
        <Box
          sx={{
            bgcolor: activeTheme.surface,
            border: `1px solid ${activeTheme.border}`,
            borderRadius: 2,
            p: 2,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 800, color: activeTheme.textPrimary }}>
            {data.name}
          </Typography>
          <Typography variant="body2" sx={{ color: activeTheme.accent, fontWeight: 700 }}>
            {data.value} attendees
          </Typography>
          {percentage && (
            <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
              {percentage}
            </Typography>
          )}
        </Box>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    if (entry.value === 0) return null;
    const percentage = ((entry.value / data.total) * 100).toFixed(1);
    return `${percentage}%`;
  };

  return (
    <GlassCard>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, color: activeTheme.textPrimary }}>
        Attendee Status
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box sx={{ width: '100%', height: 300, mt: 2, minHeight: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill={activeTheme.accent}
                  dataKey="value"
                >
                  {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: activeTheme.accent }}>
                {data.total}
              </Typography>
              <Typography variant="body2" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
                Total Attendees
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS[0] }}>
                {data.registered}
              </Typography>
              <Typography variant="body2" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
                Registered
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS[1] }}>
                {data.checkedIn}
              </Typography>
              <Typography variant="body2" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
                Checked In
              </Typography>
            </Box>
            {data.noShow > 0 && (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: COLORS[2] }}>
                  {data.noShow}
                </Typography>
                <Typography variant="body2" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
                  No Shows
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </GlassCard>
  );
}

