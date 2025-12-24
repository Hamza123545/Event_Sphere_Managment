/**
 * AttendeeCountWidget Component
 * Displays total, registered, checked-in counts with pie chart
 * Implements T190
 */

import { Paper, Typography, Box, Grid } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import type { AttendeeCountMetrics } from '../../types/analytics';

interface AttendeeCountWidgetProps {
  data: AttendeeCountMetrics;
}

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f'];

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
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {data.name}
          </Typography>
          <Typography variant="body2" color="primary">
            {data.value} attendees
          </Typography>
          {percentage && (
            <Typography variant="caption" color="text.secondary">
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
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Attendee Status
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Box sx={{ width: '100%', height: 300, mt: 2 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {data.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Attendees
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'medium', color: COLORS[0] }}>
                {data.registered}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registered
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 'medium', color: COLORS[1] }}>
                {data.checkedIn}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Checked In
              </Typography>
            </Box>
            {data.noShow > 0 && (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'medium', color: COLORS[2] }}>
                  {data.noShow}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No Shows
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

