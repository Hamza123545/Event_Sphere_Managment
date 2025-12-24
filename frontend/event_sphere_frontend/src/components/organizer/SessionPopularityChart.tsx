/**
 * SessionPopularityChart Component
 * Bar chart displaying sessions sorted by registrations
 * Implements T189
 */

import { Paper, Typography, Box } from '@mui/material';
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
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {payload[0].payload.fullName}
          </Typography>
          <Typography variant="body2" color="primary">
            Registrations: {payload[0].value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Capacity: {payload[0].payload.capacity}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Utilization: {payload[0].payload.utilizationRate.toFixed(1)}%
          </Typography>
        </Box>
      );
    }
    return null;
  };

  if (data.sessions.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Session Popularity
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No session data available
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Top Sessions by Registrations
      </Typography>
      <Box sx={{ width: '100%', height: 400, mt: 2 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="registrations" fill="#1976d2" name="Registrations" />
            <Bar dataKey="capacity" fill="#9e9e9e" name="Capacity" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
      {data.sessions.length > 10 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Showing top 10 sessions out of {data.sessions.length} total
        </Typography>
      )}
    </Paper>
  );
}

