/**
 * SessionPopularityChart Component
 * Bar chart displaying sessions sorted by registrations
 * Implements T189
 */

import { Typography, Box } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { SessionPopularityMetrics } from '../../types/analytics';
import {
  GlassCard,
  activeTheme,
} from '../../theme/designSystem';

interface SessionPopularityChartProps {
  data: SessionPopularityMetrics;
}

export default function SessionPopularityChart({ data }: SessionPopularityChartProps) {
  // Prepare chart data - limit to top 10 sessions for readability
  const chartData = data.sessions.slice(0, 10).map((session) => ({
    name: session.title.length > 30 ? `${session.title.substring(0, 30)}...` : session.title,
    fullName: session.title,
    registrations: session.registrations,
    capacity: session.capacity,
    utilizationRate: session.utilizationRate,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: activeTheme.surface,
            border: `1px solid ${activeTheme.border}`,
            borderRadius: 2,
            p: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: activeTheme.textPrimary }}>
            {payload[0].payload.fullName}
          </Typography>
          <Typography variant="body2" sx={{ color: activeTheme.accent, fontWeight: 700 }}>
            Registrations: {payload[0].value}
          </Typography>
          <Typography variant="body2" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
            Capacity: {payload[0].payload.capacity}
          </Typography>
          <Typography variant="body2" sx={{ color: activeTheme.textSecondary, fontWeight: 600 }}>
            Utilization: {payload[0].payload.utilizationRate.toFixed(1)}%
          </Typography>
        </Box>
      );
    }
    return null;
  };

  if (data.sessions.length === 0) {
    return (
      <GlassCard>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: activeTheme.textPrimary }}>
          Session Popularity
        </Typography>
        <Typography variant="body2" sx={{ color: activeTheme.textSecondary }}>
          No session data available
        </Typography>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, color: activeTheme.textPrimary }}>
        Top Sessions by Registrations
      </Typography>
      <Box sx={{ width: '100%', height: 400, mt: 2, minHeight: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={activeTheme.border} />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fontSize: 12, fill: activeTheme.textSecondary }}
            />
            <YAxis tick={{ fill: activeTheme.textSecondary }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="registrations" fill={activeTheme.accent} name="Registrations" />
            <Bar dataKey="capacity" fill={activeTheme.textSecondary} name="Capacity" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
      {data.sessions.length > 10 && (
        <Typography variant="caption" sx={{ color: activeTheme.textSecondary, fontWeight: 600, mt: 2, display: 'block' }}>
          Showing top 10 sessions out of {data.sessions.length} total
        </Typography>
      )}
    </GlassCard>
  );
}

